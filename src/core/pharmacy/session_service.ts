/**
 * Falcon Pharmacy System - Session & Authentication Service
 *
 * Authentication is delegated to Supabase Auth (email/password). The
 * authenticated JWT carries the user identity; Row Level Security resolves the
 * tenant from `public.users.account_id` via `current_user_account_id()`.
 *
 * This service loads and caches the active session profile (user + account +
 * branch + permissions) which every repository uses as its context.
 */

import { supabase } from '@/core/supabase/supabase_client';
import type { PharmacyUser } from '@/types/pharmacy';

export interface PharmacySession {
  authUserId: string;
  accountId: string;
  branchId: string | null;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
  allBranchesAccess: boolean;
  allowedBranchIds: string[];
  phone: string | null;
  permissions: Record<string, boolean>;
  profile: PharmacyUser | null;
}

const SESSION_CACHE_KEY = 'falcon_pharmacy_session';

/** Reads the cached session synchronously (used for initial store hydration). */
export const readCachedSession = (): PharmacySession | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PharmacySession;
  } catch {
    return null;
  }
};

export const cacheSession = (session: PharmacySession | null): void => {
  if (typeof window === 'undefined') return;
  if (session) {
    window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    window.localStorage.setItem('falcon_inventory_active_account', session.accountId);
    document.cookie = 'falcon_pharmacy_session=1; path=/; max-age=2592000; SameSite=Lax';
  } else {
    window.localStorage.removeItem(SESSION_CACHE_KEY);
    window.localStorage.removeItem('falcon_inventory_active_account');
    document.cookie = 'falcon_pharmacy_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
};

const loadPermissions = async (userId: string): Promise<Record<string, boolean>> => {
  const { data, error } = await supabase
    .from('permissions')
    .select('permission_key, is_allowed')
    .eq('user_id', userId);

  if (error || !data) return {};
  return data.reduce<Record<string, boolean>>((acc, row) => {
    if (row.permission_key) acc[row.permission_key] = Boolean(row.is_allowed);
    return acc;
  }, {});
};

export const buildSessionFromProfile = async (
  authUserId: string,
  email: string,
  metadata: Record<string, unknown>,
  profile: PharmacyUser | null
): Promise<PharmacySession> => {
  const accountId =
    profile?.account_id ||
    (metadata.account_id as string | undefined) ||
    '';

  const branchId =
    profile?.assigned_branch_id ||
    (metadata.assigned_branch_id as string | undefined) ||
    null;

  const allowedBranchIds = Array.isArray(profile?.allowed_branch_ids)
    ? (profile!.allowed_branch_ids as string[])
    : [];

  return {
    authUserId,
    accountId,
    branchId,
    name: profile?.name || (metadata.name as string) || email,
    email,
    role: profile?.role || (metadata.role as string) || 'employee',
    isOwner: (profile?.role || metadata.role) === 'owner',
    allBranchesAccess: Boolean(profile?.all_branches_access),
    allowedBranchIds,
    phone: profile?.phone || null,
    permissions: await loadPermissions(authUserId),
    profile,
  };
};

/** Authenticates with Supabase Auth and returns the fully hydrated session. */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<PharmacySession> => {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    throw new Error(
      error?.message === 'Invalid login credentials'
        ? 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.'
        : error?.message || 'تعذّر تسجيل الدخول.'
    );
  }

  const profile = await fetchProfile(data.user.id);
  const session = await buildSessionFromProfile(
    data.user.id,
    data.user.email || cleanEmail,
    (data.user.user_metadata || {}) as Record<string, unknown>,
    profile
  );

  if (!session.accountId) {
    await supabase.auth.signOut().catch(() => {});
    throw new Error('هذا المستخدم غير مرتبط بأي حساب. تواصل مع مسؤول الحساب.');
  }

  cacheSession(session);
  return session;
};

/** Fetches the public.users profile row for the given auth user id. */
export const fetchProfile = async (userId: string): Promise<PharmacyUser | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
};

/** Restores the session from the persisted Supabase Auth session. */
export const restoreSession = async (): Promise<PharmacySession | null> => {
  const { data } = await supabase.auth.getSession();
  const authUser = data.session?.user;

  if (!authUser) {
    cacheSession(null);
    return null;
  }

  const profile = await fetchProfile(authUser.id);
  const session = await buildSessionFromProfile(
    authUser.id,
    authUser.email || '',
    (authUser.user_metadata || {}) as Record<string, unknown>,
    profile
  );

  cacheSession(session);
  return session;
};

export const signOut = async (): Promise<void> => {
  cacheSession(null);
  await supabase.auth.signOut().catch(() => {});
};

/**
 * Registers a brand-new pharmacy account through the privileged server route.
 * Returns the created session so the owner can start working immediately.
 */
export const registerAccount = async (payload: {
  pharmacyName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<PharmacySession> => {
  const res = await fetch('/api/auth/register-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(json.error || 'تعذّر إنشاء الحساب.');
  }

  return signInWithEmail(payload.email, payload.password);
};
