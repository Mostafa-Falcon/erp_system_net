import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type {
  InventoryTransaction,
  InventoryTransactionType,
  StockLevel,
  ProductBatch,
} from '@/types';

export class StockMovementService {
  /**
   * Applies a delta to a product's lot/batch in a warehouse.
   * MUST be called inside an active `db.transaction` (Dexie zone) so the
   * whole operation stays atomic. Creates the lot when it does not exist.
   */
  public static async applyBatchDelta(params: {
    orgId: string;
    productId: string;
    warehouseId: string;
    batchNumber: string;
    expiryDate?: string | null;
    delta: number; // base units; positive = in, negative = out
    unitCost?: number;
    isOutbound: boolean;
  }): Promise<ProductBatch> {
    const now = new Date().toISOString();
    const existing = await db.product_batches
      .where('product_id')
      .equals(params.productId)
      .and(
        (b) =>
          b.warehouse_id === params.warehouseId &&
          b.batch_number.toLowerCase() === params.batchNumber.toLowerCase()
      )
      .first();

    if (!existing) {
      if (params.isOutbound) {
        // Outbound from a missing lot is a data inconsistency: clamp to zero.
        const ghost: ProductBatch = {
          id: uuidv4(),
          org_id: params.orgId,
          product_id: params.productId,
          warehouse_id: params.warehouseId,
          batch_number: params.batchNumber,
          expiry_date: params.expiryDate || null,
          initial_quantity: 0,
          current_quantity: 0,
          purchase_price: params.unitCost,
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
        };
        await db.product_batches.add(ghost);
        await SyncQueueManager.enqueue('product_batches', ghost.id, 'insert', ghost);
        return ghost;
      }

      const created: ProductBatch = {
        id: uuidv4(),
        org_id: params.orgId,
        product_id: params.productId,
        warehouse_id: params.warehouseId,
        batch_number: params.batchNumber,
        expiry_date: params.expiryDate || null,
        initial_quantity: Math.max(0, params.delta),
        current_quantity: Math.max(0, params.delta),
        purchase_price: params.unitCost,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
      };
      await db.product_batches.add(created);
      await SyncQueueManager.enqueue('product_batches', created.id, 'insert', created);
      return created;
    }

    const nextQuantity = Math.max(0, existing.current_quantity + params.delta);
    const updated: ProductBatch = {
      ...existing,
      current_quantity: nextQuantity,
      expiry_date: params.expiryDate || existing.expiry_date,
      purchase_price: params.unitCost ?? existing.purchase_price,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.product_batches.put(updated);
    await SyncQueueManager.enqueue('product_batches', existing.id, 'update', updated);
    return updated;
  }

  /**
   * Main stock modification engine.
   * Atomically alters stock levels, records transaction ledger, and updates sync queue.
   */
  public static async recordStockMovement(params: {
    orgId: string;
    warehouseId: string;
    productId: string;
    batchId?: string | null;
    batchNumber?: string;
    expiryDate?: string | null;
    transactionType: InventoryTransactionType;
    quantity: number; // positive for inbound, negative for outbound
    unitId: string;
    conversionFactor: number;
    unitCost: number;
    referenceType?: 'sale_invoice' | 'purchase_invoice' | 'transfer' | 'manual';
    referenceId?: string | null;
    notes?: string;
    userId: string;
  }): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (params.quantity === 0) {
      return { success: false, newBalance: 0, error: 'الكمية لا يمكن أن تكون صفراً.' };
    }

    const now = new Date().toISOString();
    const stockId = `${params.warehouseId}_${params.productId}`;
    const baseQuantity = params.quantity * params.conversionFactor;

    // Product card decides whether the movement must also update lot balances.
    const product = await db.products.get(params.productId);

    // Check setting for negative stock
    const allowNegativeSetting = await db.app_settings.get('allow_negative_stock');
    const allowNegative = allowNegativeSetting?.value === 'true';

    return await db.transaction(
      'rw',
      [db.stock_levels, db.inventory_transactions, db.product_batches, db.sync_queue],
      async () => {
        const currentStock = await db.stock_levels.get(stockId);
        const currentQty = currentStock?.quantity || 0;
        const newBalance = currentQty + baseQuantity;

        if (newBalance < 0 && !allowNegative) {
          return {
            success: false,
            newBalance: currentQty,
            error: `الرصيد غير كافٍ في المخزن. الرصيد الحالي: ${currentQty}، والمطلوب خصمه: ${Math.abs(baseQuantity)}`,
          };
        }

        // Lot bookkeeping for lot-tracked products: inbound carries the supplied
        // batch number, outbound consumes the oldest-expiry lot (FIFO).
        let movementBatchId: string | null = null;
        if (product?.tracks_batch) {
          let lotNumber = params.batchNumber?.trim() || '';
          if (!lotNumber && params.batchId) {
            const knownBatch = await db.product_batches.get(params.batchId);
            lotNumber = knownBatch?.batch_number || '';
          }
          if (!lotNumber && baseQuantity < 0) {
            const candidates = await db.product_batches
              .where('product_id')
              .equals(params.productId)
              .and((b) => b.warehouse_id === params.warehouseId && b.current_quantity > 0)
              .sortBy('expiry_date');
            const chosen = candidates[0];
            if (chosen) lotNumber = chosen.batch_number;
          }
          if (lotNumber) {
            const appliedBatch = await StockMovementService.applyBatchDelta({
              orgId: params.orgId,
              productId: params.productId,
              warehouseId: params.warehouseId,
              batchNumber: lotNumber,
              expiryDate: params.expiryDate || null,
              delta: baseQuantity,
              unitCost: params.unitCost,
              isOutbound: baseQuantity < 0,
            });
            movementBatchId = appliedBatch.id;
          }
        } else if (params.batchId) {
          movementBatchId = params.batchId;
        }

        const updatedStockLevel: StockLevel = {
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

        await db.stock_levels.put(updatedStockLevel);
        await SyncQueueManager.enqueue('stock_levels', stockId, 'upsert', updatedStockLevel);

        const transactionId = uuidv4();
        const transaction: InventoryTransaction = {
          id: transactionId,
          org_id: params.orgId,
          warehouse_id: params.warehouseId,
          product_id: params.productId,
          batch_id: movementBatchId,
          transaction_type: params.transactionType,
          reference_type: params.referenceType,
          reference_id: params.referenceId,
          quantity: params.quantity,
          unit_id: params.unitId,
          unit_conversion_factor: params.conversionFactor,
          base_quantity: baseQuantity,
          unit_cost: params.unitCost,
          total_cost: Math.abs(baseQuantity * params.unitCost),
          balance_after: newBalance,
          notes: params.notes,
          created_by: params.userId,
          created_at: now,
          sync_status: 'pending',
        };

        await db.inventory_transactions.add(transaction);
        await SyncQueueManager.enqueue('inventory_transactions', transactionId, 'insert', transaction);

        return { success: true, newBalance };
      }
    );
  }

  /**
   * Get transaction history for a specific product
   */
  public static async getProductHistory(
    productId: string,
    limit = 50
  ): Promise<InventoryTransaction[]> {
    return await db.inventory_transactions
      .where('product_id')
      .equals(productId)
      .reverse()
      .limit(limit)
      .toArray();
  }
}
