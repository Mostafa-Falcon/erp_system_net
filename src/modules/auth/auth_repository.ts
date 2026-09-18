import { db } from '@/core/db/app_database';
import { supabase, isSupabaseConfigured, setOrgTransportToken, restoreOrgTransportToken } from '@/core/supabase/supabase_client';
import { networkListener } from '@/core/sync/network_listener';
import { PullSyncService } from '@/core/sync/pull_sync_service';
import type { User, Organization, Branch } from '@/types';

export class AuthRepository {
  private static readonly SESSION_STORAGE_KEY = 'falcon_erp_active_user';

  /**
   * Fast offline login via PIN Code (crucial for retail & cashiers)
   * with multi-device cloud fallback if the device is not yet seeded.
   */
  public static async loginWithPin(pin: string): Promise<User | null> {
    const cleanPin = pin.trim();

    // 1. Fast local Dexie check
    const user = await db.users
      .filter((u) => u.pin_code_hash === cleanPin && Boolean(u.is_active))
      .first();

    if (user) {
      await restoreOrgTransportToken();
      this.saveSession(user);

      if (networkListener.getStatus() && isSupabaseConfigured()) {
        PullSyncService.pullAll(user.org_id).catch(() => {});
      }

      return user;
    }

    // 2. Multi-device cloud lookup if device is online and not yet seeded
    if (networkListener.getStatus() && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('falcon_authenticate_device', {
          p_identifier: cleanPin,
          p_password: cleanPin,
        });

        if (!error && data?.success && data.user) {
          await this.bootstrapDeviceFromCloud(
            data.user,
            data.organization,
            data.branch,
            data.transport_token,
            cleanPin
          );

          this.saveSession(data.user);
          return data.user;
        }
      } catch (err) {
        console.warn('[AuthRepository] Cloud PIN login failed:', err);
      }
    }

    return null;
  }

  /**
   * Hybrid authentication: local Dexie fast check + multi-device cloud RPC
   */
  public static async loginWithEmail(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    const cleanIdentifier = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. Check local Dexie first (offline-first architecture)
      const localUser = await db.users
        .filter((u) => (
          (u.username.toLowerCase() === cleanIdentifier || u.email?.toLowerCase() === cleanIdentifier) &&
          Boolean(u.is_active)
        ))
        .first();

      // If user exists locally and password/PIN matches local record
      if (localUser && localUser.pin_code_hash === cleanPassword) {
        await restoreOrgTransportToken();
        this.saveSession(localUser);

        // If online, perform background sync to capture updates from other devices
        if (networkListener.getStatus() && isSupabaseConfigured()) {
          PullSyncService.pullAll(localUser.org_id).catch(() => {});
        }

        return { user: localUser };
      }

      // 2. Multi-device cloud login: query falcon_authenticate_device RPC
      if (networkListener.getStatus() && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.rpc('falcon_authenticate_device', {
            p_identifier: cleanIdentifier,
            p_password: cleanPassword,
          });

          if (!error && data?.success && data.user) {
            await this.bootstrapDeviceFromCloud(
              data.user,
              data.organization,
              data.branch,
              data.transport_token,
              cleanPassword
            );

            this.saveSession(data.user);
            return { user: data.user };
          } else if (data && !data.success) {
            return { user: null, error: data.error };
          }
        } catch (cloudErr) {
          console.warn('[AuthRepository] Cloud authentication error:', cloudErr);
        }

        // Optional fallback: Supabase Auth standard signInWithPassword
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanIdentifier,
            password: cleanPassword,
          });

          if (!authError && authData.user) {
            let user = await db.users.get(authData.user.id);
            if (!user) {
              user = await db.users.where('email').equals(cleanIdentifier).first();
            }
            if (user) {
              await restoreOrgTransportToken();
              this.saveSession(user);
              return { user };
            }
          }
        } catch {
          // Cloud auth network failed, fall through to informative error
        }
      }

      // 3. Informative, precise error reporting
      if (localUser) {
        return { user: null, error: 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور والمحاولة مجدداً.' };
      }

      return { user: null, error: 'بيانات الدخول غير صحيحة أو المستخدم غير موجود. إذا كانت هذه أول مرة، يرجى إنشاء حساب منشأة جديد.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة تسجيل الدخول.';
      return { user: null, error: msg };
    }
  }

  /**
   * Initializes a brand-new device with the organization's cloud profile,
   * configures RLS transport headers, and seeds local Dexie for offline readiness.
   */
  private static async bootstrapDeviceFromCloud(
    cloudUser: User,
    cloudOrg: Organization | null,
    cloudBranch: Branch | null,
    transportToken: string,
    cleanPassword?: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // 1. Activate transport token on client immediately for all cloud requests
    if (transportToken) {
      setOrgTransportToken(transportToken);
    }

    // 2. Persist organization, branch, user, and transport setting in local Dexie
    await db.transaction(
      'rw',
      [db.organizations, db.branches, db.users, db.app_settings],
      async () => {
        if (cloudOrg) {
          await db.organizations.put({
            id: cloudOrg.id,
            name: cloudOrg.name,
            activity_type: cloudOrg.activity_type || 'retail',
            currency: cloudOrg.currency || 'EGP',
            transport_token: transportToken,
            is_active: true,
            created_at: cloudOrg.created_at || now,
            updated_at: cloudOrg.updated_at || now,
            sync_status: 'synced',
          });
        }

        if (cloudBranch) {
          await db.branches.put({
            id: cloudBranch.id,
            org_id: cloudBranch.org_id || cloudUser.org_id,
            code: cloudBranch.code || 'BR-01',
            name: cloudBranch.name || 'الفرع الرئيسي',
            is_main: cloudBranch.is_main ?? true,
            is_active: true,
            created_at: cloudBranch.created_at || now,
            updated_at: cloudBranch.updated_at || now,
            sync_status: 'synced',
          });
        }

        if (transportToken) {
          await db.app_settings.put({
            id: 'org_transport_token',
            org_id: cloudUser.org_id,
            value: transportToken,
            description: 'Organization transport token for multi-device RLS authorization.',
            updated_at: now,
            sync_status: 'synced',
          });
        }

        await db.users.put({
          id: cloudUser.id,
          org_id: cloudUser.org_id,
          branch_id: cloudUser.branch_id || cloudBranch?.id,
          username: cloudUser.username,
          full_name: cloudUser.full_name,
          email: cloudUser.email,
          role: cloudUser.role,
          pin_code_hash: cleanPassword || cloudUser.pin_code_hash, // cached locally for subsequent offline logins
          is_active: true,
          created_at: cloudUser.created_at || now,
          updated_at: cloudUser.updated_at || now,
          sync_status: 'synced',
        });
      }
    );

    // 3. Trigger immediate pull sync for all organizational data (products, invoices, etc.)
    PullSyncService.pullAll(cloudUser.org_id).catch((err) => {
      console.warn('[AuthRepository] Initial multi-device background pull failed:', err);
    });
  }

  public static saveSession(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(user));
      document.cookie = 'falcon_session_active=1; path=/; max-age=2592000; SameSite=Lax';
    }
  }

  public static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(this.SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_STORAGE_KEY);
      document.cookie = 'falcon_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
  }
}
