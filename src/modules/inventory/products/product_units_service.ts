import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import { syncCoordinator } from '@/core/sync/sync_coordinator';
import type { ProductUnit } from '@/types';

export class ProductUnitsService {
  /**
   * Replace all secondary units for a given product atomically
   */
  public static async replaceProductUnits(
    productId: string,
    units: Omit<ProductUnit, 'id' | 'product_id' | 'created_at' | 'updated_at' | 'sync_status'>[]
  ): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.product_units, db.sync_queue], async () => {
      const existing = await db.product_units.where('product_id').equals(productId).toArray();
      for (const rec of existing) {
        await db.product_units.delete(rec.id);
        await SyncQueueManager.enqueue('product_units', rec.id, 'delete', { id: rec.id });
      }

      for (const u of units) {
        const uId = uuidv4();
        const rec: ProductUnit = {
          ...u,
          id: uId,
          product_id: productId,
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
        };
        await db.product_units.add(rec);
        await SyncQueueManager.enqueue('product_units', uId, 'insert', rec);
      }
    });

    syncCoordinator.triggerSync().catch(console.error);
  }

  /**
   * Get all packaging/secondary units for a product
   */
  public static async getProductUnits(productId: string): Promise<ProductUnit[]> {
    return await db.product_units.where('product_id').equals(productId).toArray();
  }
}
