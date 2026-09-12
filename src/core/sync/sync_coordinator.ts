import { db } from '@/core/db/app_database';
import { supabase, isSupabaseConfigured } from '@/core/supabase/supabase_client';
import { networkListener } from './network_listener';
import { SyncQueueManager } from './sync_queue_manager';
import type { SyncQueueItem } from '@/types';

/**
 * ترتيب أولوية المزامنة لضمان حفظ الجداول الرئيسية قبل الجداول التابعة (لتفادي أخطاء Foreign Key)
 */
const TABLE_SYNC_ORDER: Record<string, number> = {
  organizations: 1,
  branches: 2,
  warehouses: 3,
  treasuries: 4,
  units: 5,
  product_categories: 6,
  product_brands: 7,
  products: 8,
  product_units: 9,
  product_batches: 10,
  stock_levels: 11,
  inventory_transactions: 12,
  contacts: 13,
  sales_invoices: 14,
  sales_invoice_items: 15,
  purchase_invoices: 16,
  purchase_invoice_items: 17,
};

/**
 * تنقية وتجهيز البيانات المتزامنة مع جداول Supabase السحابية
 * يمنع أخطاء PostgREST (PGRST204) مع حفظ الخصائص الموسعة في حقل description
 */
export function sanitizePayloadForCloud(table: string, payload: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...payload };
  delete clean.sync_status;

  if (table === 'products') {
    const extendedMeta: Record<string, unknown> = {};
    const extendedKeys = [
      'measurement_type',
      'name_en',
      'scientific_name',
      'shelf_location',
      'alternate_barcodes',
      'scale_code',
      'has_levels',
      'old_sale_price',
      'has_dual_pricing',
      'is_taxable',
      'is_quick_pos',
      'notes',
      'product_type',
    ];

    for (const key of extendedKeys) {
      if (clean[key] !== undefined) {
        extendedMeta[key] = clean[key];
        delete clean[key];
      }
    }

    if (Object.keys(extendedMeta).length > 0) {
      const existingDesc = typeof clean.description === 'string' ? clean.description : '';
      clean.description = JSON.stringify({
        _falcon_meta: true,
        desc: existingDesc,
        ...extendedMeta,
      });
    }

    const allowedColumns = new Set([
      'id', 'org_id', 'sku', 'name', 'category_id', 'brand_id', 'item_type',
      'base_unit_id', 'purchase_price', 'sale_price', 'wholesale_price',
      'min_sale_price', 'tax_rate', 'is_tax_inclusive', 'tracks_batch',
      'tracks_expiry', 'min_stock_alert', 'max_stock_limit', 'description',
      'image_url', 'is_active', 'created_at', 'updated_at'
    ]);

    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  } else if (table === 'product_units') {
    const allowedColumns = new Set([
      'id', 'product_id', 'unit_id', 'conversion_factor', 'barcode',
      'purchase_price', 'sale_price', 'wholesale_price', 'is_default_sale',
      'is_default_purchase', 'created_at', 'updated_at'
    ]);
    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  } else if (table === 'product_batches') {
    const allowedColumns = new Set([
      'id', 'org_id', 'product_id', 'warehouse_id', 'batch_number',
      'expiry_date', 'initial_quantity', 'current_quantity', 'purchase_price',
      'created_at', 'updated_at'
    ]);
    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  } else if (table === 'stock_levels') {
    const allowedColumns = new Set([
      'id', 'org_id', 'warehouse_id', 'product_id', 'quantity',
      'reserved_quantity', 'available_quantity', 'updated_at'
    ]);
    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  } else if (table === 'units') {
    const allowedColumns = new Set([
      'id', 'org_id', 'name', 'symbol', 'is_active', 'created_at', 'updated_at'
    ]);
    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  } else if (table === 'product_categories') {
    const allowedColumns = new Set([
      'id', 'org_id', 'parent_id', 'code', 'name', 'description', 'is_active',
      'created_at', 'updated_at'
    ]);
    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  } else if (table === 'product_brands') {
    const allowedColumns = new Set([
      'id', 'org_id', 'name', 'created_at', 'updated_at'
    ]);
    for (const k of Object.keys(clean)) {
      if (!allowedColumns.has(k)) {
        delete clean[k];
      }
    }
  }

  return clean;
}

/**
 * فك تشفير الخصائص الموسعة عند القراءة من Supabase
 */
export function unpackCloudProduct(cloudProduct: Record<string, unknown>): Record<string, unknown> {
  const result = { ...cloudProduct };
  if (typeof result.description === 'string' && result.description.startsWith('{"_falcon_meta":true')) {
    try {
      const parsed = JSON.parse(result.description);
      result.description = parsed.desc || '';
      for (const [k, v] of Object.entries(parsed)) {
        if (k !== '_falcon_meta' && k !== 'desc') {
          result[k] = v;
        }
      }
    } catch {
      // الاحتفاظ بالنص كما هو في حال تعذر التحليل
    }
  }
  return result;
}

/**
 * 🦅 Falcon ERP - Hybrid Sync Coordinator
 * منسق المزامنة الهجين الفوري بين قاعدة البيانات المحلية Dexie و Supabase Cloud.
 */
export class SyncCoordinator {
  private static instance: SyncCoordinator;
  private isSyncing = false;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // مراقبة عودة الاتصال بالإنترنت
    networkListener.subscribe((isOnline) => {
      if (isOnline) {
        this.triggerSync();
      }
    });

    // دورة مزامنة تلقائية احتياطية كل 20 ثانية
    if (typeof window !== 'undefined') {
      this.syncIntervalId = setInterval(() => {
        if (networkListener.getStatus()) {
          this.triggerSync();
        }
      }, 20000);
    }
  }

  public static getInstance(): SyncCoordinator {
    if (!SyncCoordinator.instance) {
      SyncCoordinator.instance = new SyncCoordinator();
    }
    return SyncCoordinator.instance;
  }

  /**
   * إطلاق المزامنة الفورية
   */
  public async triggerSync(): Promise<{ success: boolean; pushed: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, pushed: 0, error: 'Sync already in progress' };
    }

    if (!networkListener.getStatus() || !isSupabaseConfigured()) {
      return { success: false, pushed: 0, error: 'Offline or Supabase not configured' };
    }

    this.isSyncing = true;
    let pushedCount = 0;

    try {
      // جلب العناصر المعلقة
      const pendingItems = await SyncQueueManager.getPendingItems(50);
      if (pendingItems.length === 0) {
        return { success: true, pushed: 0 };
      }

      // ترتيب العمليات حسب الأسبقية والعلاقات الأبوية
      pendingItems.sort((a, b) => {
        const orderA = TABLE_SYNC_ORDER[a.entity_table] ?? 50;
        const orderB = TABLE_SYNC_ORDER[b.entity_table] ?? 50;
        return orderA - orderB;
      });

      for (const item of pendingItems) {
        const success = await this.processSyncItem(item);
        if (success) {
          pushedCount++;
        } else {
          // التوقف عند تعثر عنصر للحفاظ على الترتيب المنطقي
          break;
        }
      }

      return { success: true, pushed: pushedCount };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown sync error';
      return { success: false, pushed: pushedCount, error: msg };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * معالجة عنصر مزامنة واحد ودفع التغيير إلى Supabase
   */
  private async processSyncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      await SyncQueueManager.markInFlight(item.id);
      const rawPayload = JSON.parse(item.payload) as Record<string, unknown>;

      // تنقية البيانات لتطابق جداول Supabase 100%
      const payload = sanitizePayloadForCloud(item.entity_table, rawPayload);

      let error: { message: string } | null = null;

      switch (item.operation) {
        case 'insert':
        case 'upsert': {
          const { error: err } = await supabase
            .from(item.entity_table)
            .upsert(payload, { onConflict: 'id' });
          error = err;
          break;
        }

        case 'update': {
          const { error: err } = await supabase
            .from(item.entity_table)
            .update(payload)
            .eq('id', item.entity_id);
          error = err;
          break;
        }

        case 'delete': {
          const { error: err } = await supabase
            .from(item.entity_table)
            .delete()
            .eq('id', item.entity_id);
          error = err;
          break;
        }
      }

      if (error) {
        console.warn(`[Sync] Error syncing ${item.entity_table} (${item.entity_id}):`, error.message);
        await SyncQueueManager.markFailed(item.id, error.message);
        return false;
      }

      // تعليم العنصر كمكتمل في طابور المزامنة
      await SyncQueueManager.markSynced(item.id);

      // تحديث حالة السجل محلياً إلى synced
      try {
        const table = (db as unknown as Record<string, { update: (id: string, updates: Record<string, unknown>) => Promise<unknown> }>)[item.entity_table];
        if (table && item.operation !== 'delete') {
          await table.update(item.entity_id, { sync_status: 'synced' });
        }
      } catch {
        // تجاهل أي خطأ محلي ثانوي
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Exception during item sync';
      console.error(`[Sync] Exception syncing ${item.entity_table}:`, msg);
      await SyncQueueManager.markFailed(item.id, msg);
      return false;
    }
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncCoordinator = SyncCoordinator.getInstance();
