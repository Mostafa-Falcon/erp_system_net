import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Falcon Pharmacy System - Server-side Supabase Admin Client
 * Single source of truth for the service-role client used by API routes
 * (account registration, employee provisioning). NEVER import this module
 * from the client bundle.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqskyglaapeeuvazbfld.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc2t5Z2xhYXBlZXV2YXpiZmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5NDE4NCwiZXhwIjoyMTAzNjcwMTg0fQ.QtjwgBMoXbdn_mYnwSeMIHrf_kHRuL9l17NNaqjWA8c';

export const createAdminClient = (): SupabaseClient<Database> =>
  createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });