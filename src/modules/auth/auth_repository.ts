import { db } from '@/core/db/app_database';
import { supabase, isSupabaseConfigured } from '@/core/supabase/supabase_client';
import { networkListener } from '@/core/sync/network_listener';
import type { User } from '@/types';

export class AuthRepository {
  private static readonly SESSION_STORAGE_KEY = 'falcon_erp_active_user';

  /**
   * Fast offline login via PIN Code (crucial for retail & cashiers)
   */
  public static async loginWithPin(pin: string): Promise<User | null> {
    const user = await db.users
      .filter((u) => u.pin_code_hash === pin && u.is_active)
      .first();

    if (user) {
      this.saveSession(user);
      return user;
    }
    return null;
  }

  /**
   * Hybrid authentication: local Dexie fast check + Supabase cloud auth
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
        this.saveSession(localUser);
        return { user: localUser };
      }

      // 2. If online and Supabase is configured, try Supabase Auth
      if (networkListener.getStatus() && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanIdentifier,
            password: cleanPassword,
          });

          if (!error && data.user) {
            let user = await db.users.get(data.user.id);
            if (!user) {
              user = await db.users.where('email').equals(cleanIdentifier).first();
            }
            if (user) {
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

  public static saveSession(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(user));
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
    }
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
  }
}
