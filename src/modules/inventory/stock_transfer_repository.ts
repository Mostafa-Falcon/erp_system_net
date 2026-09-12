import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type {
  StockTransfer,
  StockTransferItem,
  InventoryTransaction,
  StockLevel,
  ProductBatch,
  Product,
} from '@/types';

export interface TransferItemInput {
  productId: string;
  batchId?: string | null;
  unitId: string;
  conversionFactor: number;
  quantity: number; // in selected unit
  unitCost: number;
}

const TRANSFER_PREFIX = 'TRF-';

/**
 * 🦅 Falcon ERP - Cross-Warehouse Stock Transfer Repository
 * Draft → Completed lifecycle. Completion is atomic: it moves stock
 * levels, writes both movement legs (out/in) and migrates lots when the
 * product tracks batches. Any failure rolls the whole transfer back.
 */
export class StockTransferRepository {
  public static async getTransfers(orgId: string): Promise<StockTransfer[]> {
    return await db.stock_transfers
      .where('org_id')
      .equals(orgId)
      .reverse()
      .sortBy('created_at');
  }

  public static async getTransferById(id: string): Promise<StockTransfer | undefined> {
    return await db.stock_transfers.get(id);
  }

  public static async getTransferItems(transferId: string): Promise<StockTransferItem[]> {
    return await db.stock_transfer_items.where('transfer_id').equals(transferId).toArray();
  }

  public static async getNextTransferNumber(orgId: string): Promise<string> {
    const count = await db.stock_transfers.where('org_id').equals(orgId).count();
    return `${TRANSFER_PREFIX}${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Creates a transfer in draft state with its line items.
   */
  public static async createTransfer(params: {
    orgId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: TransferItemInput[];
    notes?: string;
    userId: string;
  }): Promise<{ success: boolean; transfer?: StockTransfer; error?: string }> {
    if (params.fromWarehouseId === params.toWarehouseId) {
      return { success: false, error: 'لا يمكن التحويل إلى نفس المخزن.' };
    }
    if (params.items.length === 0) {
      return { success: false, error: 'يجب إضافة صنف واحد على الأقل للتحويل.' };
    }
    if (params.items.some((i) => !(i.quantity > 0))) {
      return { success: false, error: 'الكميات يجب أن تكون أكبر من صفر.' };
    }

    const now = new Date().toISOString();
    const transferId = uuidv4();
    const transfer: StockTransfer = {
      id: transferId,
      org_id: params.orgId,
      transfer_no: await StockTransferRepository.getNextTransferNumber(params.orgId),
      from_warehouse_id: params.fromWarehouseId,
      to_warehouse_id: params.toWarehouseId,
      status: 'draft',
      notes: params.notes,
      created_by: params.userId,
      created_at: now,
      completed_at: null,
      sync_status: 'pending',
    };

    const items: StockTransferItem[] = params.items.map((i) => ({
      id: uuidv4(),
      transfer_id: transferId,
      product_id: i.productId,
      batch_id: i.batchId || null,
      unit_id: i.unitId,
      conversion_factor: i.conversionFactor,
      quantity: i.quantity,
      base_quantity: i.quantity * i.conversionFactor,
      unit_cost: i.unitCost,
      total_cost: i.quantity * i.conversionFactor * i.unitCost,
    }));

    await db.transaction(
      'rw',
      [db.stock_transfers, db.stock_transfer_items, db.sync_queue],
      async () => {
        await db.stock_transfers.add(transfer);
        await SyncQueueManager.enqueue('stock_transfers', transferId, 'insert', transfer);
        await db.stock_transfer_items.bulkAdd(items);
        for (const item of items) {
          await SyncQueueManager.enqueue('stock_transfer_items', item.id, 'insert', item);
        }
      }
    );

    return { success: true, transfer };
  }

  /**
   * Completes a draft/pending transfer atomically.
   */
  public static async completeTransfer(transferId: string): Promise<{ success: boolean; error?: string }> {
    const transfer = await db.stock_transfers.get(transferId);
    if (!transfer) {
      return { success: false, error: 'التحويل غير موجود.' };
    }
    if (transfer.status === 'completed') {
      return { success: false, error: 'هذا التحويل مكتمل بالفعل.' };
    }
    if (transfer.status === 'cancelled') {
      return { success: false, error: 'لا يمكن استكمال تحويل ملغي.' };
    }

    const items = await db.stock_transfer_items.where('transfer_id').equals(transferId).toArray();
    const allowNegativeSetting = await db.app_settings.get('allow_negative_stock');
    const allowNegative = allowNegativeSetting?.value === 'true';
    const now = new Date().toISOString();

    try {
      await db.transaction(
        'rw',
        [
          db.stock_transfers,
          db.stock_levels,
          db.inventory_transactions,
          db.product_batches,
          db.sync_queue,
        ],
        async () => {
          // ---- Pass 1: availability pre-check (all lines before touching any) ----
          for (const item of items) {
            const stockId = `${transfer.from_warehouse_id}_${item.product_id}`;
            const fromStock = await db.stock_levels.get(stockId);
            const currentQty = fromStock?.quantity || 0;
            if (currentQty < item.base_quantity && !allowNegative) {
              throw new Error(
                `الرصيد غير كافٍ للصنف المختار في مخزن المصدر. الرصيد: ${currentQty} والمطلوب: ${item.base_quantity}`
              );
            }
          }

          // ---- Pass 2: apply movements (single transaction) ----
          for (const item of items) {
            const product = (await db.products.get(item.product_id)) as Product | undefined;

            // 2.a Source warehouse: out leg
            await StockTransferRepository.applyLeg({
              orgId: transfer.org_id,
              warehouseId: transfer.from_warehouse_id,
              productId: item.product_id,
              baseQuantity: -item.base_quantity,
              quantity: -item.quantity,
              unitId: item.unit_id,
              conversionFactor: item.conversion_factor,
              unitCost: item.unit_cost,
              transactionType: 'transfer_out',
              referenceId: transfer.id,
              notes: `تحويل ${transfer.transfer_no}`,
              userId: transfer.created_by,
              now,
            });

            // 2.b Destination warehouse: in leg
            await StockTransferRepository.applyLeg({
              orgId: transfer.org_id,
              warehouseId: transfer.to_warehouse_id,
              productId: item.product_id,
              baseQuantity: item.base_quantity,
              quantity: item.quantity,
              unitId: item.unit_id,
              conversionFactor: item.conversion_factor,
              unitCost: item.unit_cost,
              transactionType: 'transfer_in',
              referenceId: transfer.id,
              notes: `تحويل ${transfer.transfer_no}`,
              userId: transfer.created_by,
              now,
            });

            // 2.c Lot migration for expiry/batch-tracked products
            if (product?.tracks_batch) {
              await StockTransferRepository.migrateBatch({
                orgId: transfer.org_id,
                productId: item.product_id,
                fromWarehouseId: transfer.from_warehouse_id,
                toWarehouseId: transfer.to_warehouse_id,
                batchId: item.batch_id,
                baseQuantity: item.base_quantity,
                unitCost: item.unit_cost,
                now,
              });
            }
          }

          // ---- Pass 3: finalize header ----
          const completed: StockTransfer = {
            ...transfer,
            status: 'completed',
            completed_at: now,
            sync_status: 'pending',
          };
          await db.stock_transfers.put(completed);
          await SyncQueueManager.enqueue('stock_transfers', transfer.id, 'update', completed);
        }
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'خطأ أثناء استكمال التحويل.' };
    }
  }

  /**
   * Cancels a draft/pending transfer.
   */
  public static async cancelTransfer(transferId: string): Promise<{ success: boolean; error?: string }> {
    const transfer = await db.stock_transfers.get(transferId);
    if (!transfer) {
      return { success: false, error: 'التحويل غير موجود.' };
    }
    if (transfer.status === 'completed') {
      return { success: false, error: 'لا يمكن إلغاء تحويل مكتمل.' };
    }

    const cancelled: StockTransfer = {
      ...transfer,
      status: 'cancelled',
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.stock_transfers, db.sync_queue], async () => {
      await db.stock_transfers.put(cancelled);
      await SyncQueueManager.enqueue('stock_transfers', transfer.id, 'update', cancelled);
    });

    return { success: true };
  }

  /**
   * Internal: applies one stock-movement leg inside an active transaction.
   */
  private static async applyLeg(params: {
    orgId: string;
    warehouseId: string;
    productId: string;
    baseQuantity: number;
    quantity: number;
    unitId: string;
    conversionFactor: number;
    unitCost: number;
    transactionType: 'transfer_out' | 'transfer_in';
    referenceId: string;
    notes: string;
    userId: string;
    now: string;
  }): Promise<void> {
    const stockId = `${params.warehouseId}_${params.productId}`;
    const currentStock = await db.stock_levels.get(stockId);
    const currentQty = currentStock?.quantity || 0;
    const newBalance = currentQty + params.baseQuantity;

    const updatedLevel: StockLevel = {
      id: stockId,
      org_id: params.orgId,
      warehouse_id: params.warehouseId,
      product_id: params.productId,
      quantity: newBalance,
      reserved_quantity: currentStock?.reserved_quantity || 0,
      available_quantity: newBalance - (currentStock?.reserved_quantity || 0),
      updated_at: params.now,
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
      transaction_type: params.transactionType,
      reference_type: 'transfer',
      reference_id: params.referenceId,
      quantity: params.quantity,
      unit_id: params.unitId,
      unit_conversion_factor: params.conversionFactor,
      base_quantity: params.baseQuantity,
      unit_cost: params.unitCost,
      total_cost: Math.abs(params.baseQuantity * params.unitCost),
      balance_after: newBalance,
      notes: params.notes,
      created_by: params.userId,
      created_at: params.now,
      sync_status: 'pending',
    };
    await db.inventory_transactions.add(movement);
    await SyncQueueManager.enqueue('inventory_transactions', txId, 'insert', movement);
  }

  /**
   * Internal: migrates a lot across warehouses inside an active transaction.
   */
  private static async migrateBatch(params: {
    orgId: string;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    batchId?: string | null;
    baseQuantity: number;
    unitCost: number;
    now: string;
  }): Promise<void> {
    // Find the source lot.
    let sourceLot: ProductBatch | undefined;
    if (params.batchId) {
      sourceLot = await db.product_batches.get(params.batchId);
    } else {
      sourceLot = (
        await db.product_batches
          .where('product_id')
          .equals(params.productId)
          .and((b) => b.warehouse_id === params.fromWarehouseId)
          .toArray()
      ).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    }

    if (!sourceLot || sourceLot.current_quantity <= 0) {
      return; // No lot on hand to migrate.
    }

    // Reduce source lot (floor at zero).
    const sourceNext = Math.max(0, sourceLot.current_quantity - params.baseQuantity);
    const updatedSource: ProductBatch = {
      ...sourceLot,
      current_quantity: sourceNext,
      updated_at: params.now,
      sync_status: 'pending',
    };
    await db.product_batches.put(updatedSource);
    await SyncQueueManager.enqueue('product_batches', sourceLot.id, 'update', updatedSource);

    // Grow the destination lot (same batch number).
    const destLot = await db.product_batches
      .where('product_id')
      .equals(params.productId)
      .and(
        (b) =>
          b.warehouse_id === params.toWarehouseId &&
          b.batch_number.toLowerCase() === sourceLot.batch_number.toLowerCase()
      )
      .first();

    if (destLot) {
      const updatedDest: ProductBatch = {
        ...destLot,
        current_quantity: destLot.current_quantity + params.baseQuantity,
        updated_at: params.now,
        sync_status: 'pending',
      };
      await db.product_batches.put(updatedDest);
      await SyncQueueManager.enqueue('product_batches', destLot.id, 'update', updatedDest);
    } else {
      const createdDest: ProductBatch = {
        id: uuidv4(),
        product_id: params.productId,
        warehouse_id: params.toWarehouseId,
        batch_number: sourceLot.batch_number,
        expiry_date: sourceLot.expiry_date,
        initial_quantity: params.baseQuantity,
        current_quantity: params.baseQuantity,
        purchase_price: params.unitCost,
        created_at: params.now,
        updated_at: params.now,
        sync_status: 'pending',
      };
      await db.product_batches.add(createdDest);
      await SyncQueueManager.enqueue('product_batches', createdDest.id, 'insert', createdDest);
    }
  }
}