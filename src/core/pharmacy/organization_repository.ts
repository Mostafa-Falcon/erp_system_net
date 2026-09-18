/**
 * Organization data access: settings, team members, notifications and audit log.
 */

import { supabase } from '@/core/supabase/supabase_client';
import { throwIfError } from './helpers';
import type { AppNotification, AppSettings, PharmacyUser } from '@/types/pharmacy';

export const OrganizationRepository = {
  async getSettings(accountId: string, branchId?: string | null): Promise<AppSettings | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_deleted', false)
      .order('last_modified', { ascending: false });
    throwIfError(error);

    const rows = data ?? [];
    return rows.find((row) => row.branch_id === branchId) ?? rows[0] ?? null;
  },

  async updateSettings(id: string, patch: Partial<AppSettings>): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم العثور على الإعدادات.');
    return data;
  },

  async listUsers(accountId: string): Promise<PharmacyUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_deleted', false)
      .order('name');
    throwIfError(error);
    return data ?? [];
  },

  async updateUser(id: string, patch: Partial<PharmacyUser>): Promise<PharmacyUser> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم العثور على المستخدم.');
    return data;
  },

  async listNotifications(accountId: string, userId: string, limit = 30): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('account_id', accountId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    throwIfError(error);
    return data ?? [];
  },

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true, last_modified: new Date().toISOString() })
      .eq('id', id);
    throwIfError(error);
  },

  async logActivity(input: {
    accountId: string;
    branchId: string | null;
    userId: string | null;
    userName: string | null;
    activityType: string;
    description: string;
  }): Promise<void> {
    const { error } = await supabase.from('user_activity_logs').insert({
      id: crypto.randomUUID(),
      account_id: input.accountId,
      branch_id: input.branchId,
      user_id: input.userId,
      created_by: input.userId,
      created_by_name: input.userName,
      activity_type: input.activityType,
      description: input.description,
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      sync_version: 1,
      is_deleted: false,
    });
    if (error) throw error;
  },
};
