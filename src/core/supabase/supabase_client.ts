import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Falcon Pharmacy System - Supabase client.
 *
 * The pharmacy cloud database (`sqskyglaapeeuvazbfld`) is an online-first,
 * multi-tenant PostgreSQL instance. Tenancy is resolved by Supabase Auth:
 * every row carries an `account_id` and Row Level Security policies compare it
 * with the authenticated user's `auth.jwt() -> user_metadata -> account_id`.
 *
 * Therefore the client relies exclusively on the persisted Supabase Auth
 * session (email/password). No custom transport token header is required.
 */

const DEFAULT_SUPABASE_URL = 'https://sqskyglaapeeuvazbfld.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_m2QL4WmWnQp5GLy20CN4fg_W_YRsoJS';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    !!supabaseAnonKey &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'falcon_pharmacy_auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
