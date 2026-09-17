import { db } from '@/core/db/app_database';
import { supabase, isSupabaseConfigured } from '@/core/supabase/supabase_client';
import { networkListener } from './network_listener';

/**
 * 🦅 Falcon ERP - Cloud Pull Sync Service
 * Pulls new / modified records from Supabase into local Dexie.js with delta timestamp filtering.
 */
export class PullSyncService {
  private static readonly TABLES_TO_PULL = [
    'organizations',
    'branches',
    'users',
    'app_settings',
    'product_categories',
    'product_brands',
    'units',
    'products',
    'product_units',
    'warehouses',
    'contacts',
    'treasuries',
    'expense_categories',
    'accounts',
    'employee_attendance',
    'salary_statements',
    'employee_leaves',
    'activity_logs',
  ];

  public static async pullAll(orgId: string): Promise<Record<string, number>> {
    if (!networkListener.getStatus() || !isSupabaseConfigured()) {
      return {};
    }

    const results: Record<string, number> = {};

    for (const tableName of this.TABLES_TO_PULL) {
      try {
        const count = await this.pullTable(tableName, orgId);
        results[tableName] = count;
      } catch (e) {
        console.error(`Error pulling table ${tableName}:`, e);
      }
    }

    return results;
  }

  public static async pullTable(tableName: string, orgId: string): Promise<number> {
    const localSettingKey = `last_pull_${tableName}_${orgId}`;
    const lastPullSetting = await db.app_settings.get(localSettingKey);
    const lastPullTimestamp = lastPullSetting?.value || '1970-01-01T00:00:00.000Z';

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('org_id', orgId)
      .gt('updated_at', lastPullTimestamp)
      .order('updated_at', { ascending: true })
      .limit(200);

    if (error || !data || data.length === 0) {
      return 0;
    }

    // Upsert into local Dexie
    const localTable = (db as unknown as Record<string, { bulkPut: (records: unknown[]) => Promise<unknown> }>)[tableName];
    if (localTable) {
      const recordsToStore = data.map((item) => ({
        ...item,
        sync_status: 'synced',
      }));

      await localTable.bulkPut(recordsToStore);

      // إذا كانت التحديثات تخص app_settings، نفك تشفير أنواع المنتجات المخصصة إن وجدت
      if (tableName === 'app_settings') {
        const typesSetting = (data as Array<{ id: string; value: string }>).find(
          (d) => d.id === 'custom_product_types'
        );
        if (typesSetting && typesSetting.value) {
          try {
            const types = JSON.parse(typesSetting.value);
            if (Array.isArray(types) && types.length > 0) {
              await db.product_types.bulkPut(
                types.map((t) => ({ ...t, sync_status: 'synced' }))
              );
            }
          } catch (e) {
            console.warn('[PullSync] Error unpacking custom_product_types:', e);
          }
        }
      }

      // Save newest updated_at
      const newestDate = data[data.length - 1].updated_at;
      await db.app_settings.put({
        id: localSettingKey,
        org_id: orgId,
        value: newestDate,
        updated_at: new Date().toISOString(),
        sync_status: 'synced',
      });

      return data.length;
    }

    return 0;
  }
}
