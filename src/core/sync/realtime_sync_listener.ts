import { db } from '@/core/db/app_database';
import { supabase, isSupabaseConfigured } from '@/core/supabase/supabase_client';
import { unpackCloudProduct } from './sync_coordinator';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 🦅 Falcon ERP - Realtime Sync Listener (Supabase Realtime)
 * يستمع للتغييرات اللحظية من Supabase ويحدث قاعدة البيانات المحلية Dexie فورياً
 * تنبيه: ممنوع UPSERT على Views (الالتزام ببروتوكول Falcon)
 */
export class RealtimeSyncListener {
  private static instance: RealtimeSyncListener;
  private channel: RealtimeChannel | null = null;
  private isSubscribed = false;

  private constructor() {}

  public static getInstance(): RealtimeSyncListener {
    if (!RealtimeSyncListener.instance) {
      RealtimeSyncListener.instance = new RealtimeSyncListener();
    }
    return RealtimeSyncListener.instance;
  }

  /**
   * بدء الاستماع اللحظي لتغييرات الأصناف والمخزون
   */
  public start(orgId: string): void {
    if (this.isSubscribed || !isSupabaseConfigured() || !orgId) {
      return;
    }

    const tablesToListen = [
      'products',
      'product_units',
      'product_batches',
      'stock_levels',
      'units',
      'product_categories',
      'product_brands',
      'app_settings',
      'employee_attendance',
      'salary_statements',
      'employee_leaves',
      'activity_logs',
      'accounts',
      'journal_entries',
    ];

    let channel = supabase.channel(`falcon-inventory-realtime-${orgId}`);

    for (const tableName of tablesToListen) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        async (payload) => {
          await this.handleRealtimeEvent(tableName, payload, orgId);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.isSubscribed = true;
      }
    });

    this.channel = channel;
  }

  /**
   * معالجة الحدث اللحظي وتحديث Dexie محلياً
   */
  private async handleRealtimeEvent(
    tableName: string,
    payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> },
    orgId: string
  ): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const localTable = (db as unknown as Record<string, {
        put: (rec: unknown) => Promise<unknown>;
        delete: (id: unknown) => Promise<unknown>;
        get: (id: unknown) => Promise<unknown>;
      }>)[tableName];

      if (!localTable) return;

      if (eventType === 'DELETE') {
        const idToDelete = oldRecord?.id;
        if (idToDelete) {
          await localTable.delete(idToDelete);
        }
        return;
      }

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // التحقق من تبعية السجل للمؤسسة الحالية إن وجد حقل org_id
        if (newRecord.org_id && newRecord.org_id !== orgId) {
          return;
        }

        let recordToStore = { ...newRecord, sync_status: 'synced' };

        // فك تشفير الخصائص الموسعة للأصناف
        if (tableName === 'products') {
          recordToStore = unpackCloudProduct(recordToStore) as typeof recordToStore;
        }

        // تحديث محلي مباشر بدون إدخال في طابور المزامنة لتفادي التكرار اللانهائي
        await localTable.put(recordToStore);

        // إذا كان الحدث في إعدادات المؤسسة ويخص أنواع المنتجات، نحدث جدول product_types محلياً
        if (tableName === 'app_settings' && newRecord.id === 'custom_product_types' && typeof newRecord.value === 'string') {
          try {
            const types = JSON.parse(newRecord.value);
            if (Array.isArray(types)) {
              await db.product_types.bulkPut(types.map((t) => ({ ...t, sync_status: 'synced' })));
            }
          } catch (e) {
            console.warn('[RealtimeSyncListener] Error parsing realtime custom_product_types:', e);
          }
        }
      }
    } catch (err) {
      console.error(`[RealtimeSyncListener] Error handling event on ${tableName}:`, err);
    }
  }

  /**
   * إيقاف الاستماع
   */
  public stop(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel).catch(console.error);
      this.channel = null;
      this.isSubscribed = false;
    }
  }
}

export const realtimeSyncListener = RealtimeSyncListener.getInstance();
