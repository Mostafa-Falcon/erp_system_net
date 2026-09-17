import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type { StockLevel, InventoryTransaction } from '@/types';
import { StockMovementService } from './stock_movement_service';

export class OpeningBalanceService {
  /**
   * Registers the opening stock balance of a product in a warehouse.
   * Atomic: stock level + movement ledger + optional lot creation.
   */
  public static async openStock(params: {
    orgId: string;
    warehouseId: string;
    productId: string;
    quantity: number; // positive, in the selected unit
    unitId: string;
    conversionFactor: number;
    unitCost: number;
    batchNumber?: string; // required by UI when the product tracks lots
    expiryDate?: string | null;
    notes?: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!(params.quantity > 0)) {
      return { success: false, error: 'الكمية يجب أن تكون أكبر من صفر.' };
    }

    const product = await db.products.get(params.productId);
    if (!product) {
      return { success: false, error: 'الصنف غير موجود.' };
    }

    const baseQuantity = params.quantity * params.conversionFactor;
    const now = new Date().toISOString();
    const stockId = `${params.warehouseId}_${params.productId}`;

    try {
      await db.transaction(
        'rw',
        [db.stock_levels, db.inventory_transactions, db.product_batches, db.sync_queue],
        async () => {
          const currentStock = await db.stock_levels.get(stockId);
          const newBalance = (currentStock?.quantity || 0) + baseQuantity;

          const updatedLevel: StockLevel = {
            id: stockId,
            org_id: params.orgId,
            warehouse_id: params.warehouseId,
            product_id: params.productId,
            quantity: newBalance,
            reserved_quantity: currentStock?.reserved_quantity || 0,
            available_quantity: newBalance - (currentStock?.reserved_quantity || 0),
            updated_at: now,
            sync_status: 'pending',
          };
          await db.stock_levels.put(updatedLevel);
          await SyncQueueManager.enqueue('stock_levels', stockId, 'upsert', updatedLevel);

          const txId = uuidv4();
          const movement: InventoryTransaction = {
            id: txId,
            org_id: params.orgId,
            warehouse_id: params.warehouseId,
            product_id: params.productId,
            batch_id: null,
            transaction_type: 'opening_stock',
            reference_type: 'manual',
            quantity: params.quantity,
            unit_id: params.unitId,
            unit_conversion_factor: params.conversionFactor,
            base_quantity: baseQuantity,
            unit_cost: params.unitCost,
            total_cost: baseQuantity * params.unitCost,
            balance_after: newBalance,
            notes: params.notes || 'رصيد افتتاحي',
            created_by: params.userId,
            created_at: now,
            sync_status: 'pending',
          };
          await db.inventory_transactions.add(movement);
          await SyncQueueManager.enqueue('inventory_transactions', txId, 'insert', movement);

          // Lot bookkeeping when the product tracks lots.
          if (product.tracks_batch) {
            const lotNumber =
              params.batchNumber?.trim() ||
              `LOT-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
            const batch = await StockMovementService.applyBatchDelta({
              orgId: params.orgId,
              productId: params.productId,
              warehouseId: params.warehouseId,
              batchNumber: lotNumber,
              expiryDate: params.expiryDate,
              delta: baseQuantity,
              unitCost: params.unitCost,
              isOutbound: false,
            });
            await db.inventory_transactions.update(txId, {
              batch_id: batch.id,
              sync_status: 'pending',
            });
          }
        }
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'خطأ أثناء تسجيل الرصيد الافتتاحي.',
      };
    }
  }
}
