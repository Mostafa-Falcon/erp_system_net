/**
 * Pharmacy settings data access (single row per branch).
 */

import { supabase } from '@/core/supabase/supabase_client';
import { throwIfError } from './helpers';
import type { AppSettings } from '@/types/pharmacy';

export const SettingsRepository = {
  async getByBranch(branchId?: string | null): Promise<AppSettings | null> {
    let query = supabase.from('app_settings').select('*').eq('is_deleted', false);
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query.maybeSingle();
    throwIfError(error, 'تعذّر تحميل إعدادات الصيدلية.');
    return data;
  },

  async update(id: string, patch: Partial<AppSettings>): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error, 'تعذّر حفظ الإعدادات.');
    if (!data) throw new Error('لم يتم العثور على الإعدادات.');
    return data;
  },
};