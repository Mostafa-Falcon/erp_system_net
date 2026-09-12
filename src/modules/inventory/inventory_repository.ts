import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type {
  InventoryTransaction,
  InventoryTransactionType,
  StockLevel,
  Warehouse,
  Product,
  ProductBatch,
} from '@/types';

export class InventoryRepository {
  /**
   * Get stock level for a product in a warehouse
   */
  public static async getStockLevel(warehouseId: string, productId: string): Promise<StockLevel | undefined> {
    const stockId = `${warehouseId}_${productId}`;
    return await db.stock_levels.get(stockId);
  }

  /**
   * Get all warehouses for an organization
   */
  public static async getWarehouses(orgId: string): Promise<Warehouse[]> {
    return await db.warehouses
      .where('org_id')
      .equals(orgId)
      .and((w) => w.is_active)
      .toArray();
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
            const appliedBatch = await InventoryRepository.applyBatchDelta({
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
  public static async getProductHistory(productId: string, limit = 50): Promise<InventoryTransaction[]> {
    return await db.inventory_transactions
      .where('product_id')
      .equals(productId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Get low stock alerts for an organization
   */
  public static async getLowStockProducts(orgId: string): Promise<{ product: Product; stock: number; minAlert: number }[]> {
    const products = await db.products
      .where('org_id')
      .equals(orgId)
      .and((p) => p.is_active && p.item_type === 'storable')
      .toArray();

    const alerts: { product: Product; stock: number; minAlert: number }[] = [];

    for (const prod of products) {
      const stockLevels = await db.stock_levels
        .where('product_id')
        .equals(prod.id)
        .toArray();

      const totalStock = stockLevels.reduce((acc, s) => acc + s.quantity, 0);
      if (totalStock <= prod.min_stock_alert) {
        alerts.push({
          product: prod,
          stock: totalStock,
          minAlert: prod.min_stock_alert,
        });
      }
    }

    return alerts;
  }

  /**
   * Applies a delta to a product's lot/batch in a warehouse.
   * MUST be called inside an active `db.transaction` (Dexie zone) so the
   * whole operation stays atomic. Creates the lot when it does not exist.
   */
  private static async applyBatchDelta(params: {
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
            const lotNumber = params.batchNumber?.trim() || `LOT-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
            const batch = await InventoryRepository.applyBatchDelta({
              orgId: params.orgId,
              productId: params.productId,
              warehouseId: params.warehouseId,
              batchNumber: lotNumber,
              expiryDate: params.expiryDate,
              delta: baseQuantity,
              unitCost: params.unitCost,
              isOutbound: false,
            });
            await db.inventory_transactions.update(txId, { batch_id: batch.id, sync_status: 'pending' });
          }
        }
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'خطأ أثناء تسجيل الرصيد الافتتاحي.' };
    }
  }

  /**
   * Records a stock adjustment (counting / damage / correction).
   * Atomic: stock level + movement ledger + optional lot delta.
   */
  public static async adjustStock(params: {
    orgId: string;
    warehouseId: string;
    productId: string;
    quantity: number; // signed: positive = in, negative = out
    unitId: string;
    conversionFactor: number;
    unitCost: number;
    notes: string;
    userId: string;
    type?: 'adjustment' | 'damaged'; // 'damaged' records an outbound damage/spoilage move
  }): Promise<{ success: boolean; error?: string }> {
    if (params.quantity === 0) {
      return { success: false, error: 'الكمية يجب ألا تكون صفراً.' };
    }

    const product = await db.products.get(params.productId);
    if (!product) {
      return { success: false, error: 'الصنف غير موجود.' };
    }

    const allowNegativeSetting = await db.app_settings.get('allow_negative_stock');
    const allowNegative = allowNegativeSetting?.value === 'true';
    const baseQuantity = params.quantity * params.conversionFactor;
    const isOutbound = baseQuantity < 0;
    const now = new Date().toISOString();
    const stockId = `${params.warehouseId}_${params.productId}`;

    try {
      await db.transaction(
        'rw',
        [db.stock_levels, db.inventory_transactions, db.product_batches, db.sync_queue],
        async () => {
          const currentStock = await db.stock_levels.get(stockId);
          const currentQty = currentStock?.quantity || 0;
          const newBalance = currentQty + baseQuantity;

          if (newBalance < 0 && !allowNegative) {
            throw new Error(
              `الرصيد غير كافٍ. الرصيد الحالي: ${currentQty} والمطلوب خصمه: ${Math.abs(baseQuantity)}`
            );
          }

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
            transaction_type: isOutbound
              ? params.type === 'damaged'
                ? 'damaged'
                : 'adjustment_out'
              : 'adjustment_in',
            reference_type: 'manual',
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
          await db.inventory_transactions.add(movement);
          await SyncQueueManager.enqueue('inventory_transactions', txId, 'insert', movement);

          // Lot bookkeeping: adjustments follow the latest active lot.
          if (product.tracks_batch) {
            const latest = (
              await db.product_batches
                .where('product_id')
                .equals(params.productId)
                .and((b) => b.warehouse_id === params.warehouseId)
                .toArray()
            ).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

            if (latest || !isOutbound) {
              const lotNumber = latest?.batch_number || `ADJ-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
              const batch = await InventoryRepository.applyBatchDelta({
                orgId: params.orgId,
                productId: params.productId,
                warehouseId: params.warehouseId,
                batchNumber: lotNumber,
                expiryDate: latest?.expiry_date,
                delta: baseQuantity,
                unitCost: params.unitCost,
                isOutbound,
              });
              await db.inventory_transactions.update(txId, { batch_id: batch.id, sync_status: 'pending' });
            }
          }
        }
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'خطأ أثناء تنفيذ التسوية.',
      };
    }
  }
}
