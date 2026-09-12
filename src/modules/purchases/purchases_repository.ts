import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import { InventoryRepository } from '@/modules/inventory/inventory_repository';
import { TreasuryRepository } from '@/modules/treasury/treasury_repository';
import { ContactsRepository } from '@/modules/contacts/contacts_repository';
import { ProductRepository } from '@/modules/inventory/product_repository';
import type {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseReturn,
  InvoicePaymentType,
} from '@/types';

export class PurchasesRepository {
  /**
   * Create Purchase Invoice with complete orchestration
   */
  public static async createPurchaseInvoice(params: {
    orgId: string;
    branchId: string;
    warehouseId: string;
    supplierId: string;
    supplierInvoiceNumber: string;
    items: {
      productId: string;
      batchNumber?: string;
      expiryDate?: string | null;
      unitId: string;
      conversionFactor: number;
      quantity: number;
      unitCost: number;
      salePrice?: number;
      taxRate?: number;
    }[];
    discountAmount?: number;
    paymentType: InvoicePaymentType;
    paidAmount?: number;
    treasuryId?: string | null;
    userId: string;
    notes?: string;
  }): Promise<PurchaseInvoice> {
    if (!params.items || params.items.length === 0) {
      throw new Error('فاتورة الشراء يجب أن تحتوي على صنف واحد على الأقل');
    }

    const now = new Date().toISOString();
    const invoiceId = uuidv4();
    const count = await db.purchase_invoices.where('branch_id').equals(params.branchId).count();
    const systemInvoiceNumber = `PUR-${String(count + 1).padStart(6, '0')}`;

    let subtotal = 0;
    let totalTax = 0;

    const invoiceItems: PurchaseInvoiceItem[] = params.items.map((item) => {
      const lineCost = item.quantity * item.unitCost;
      const taxRate = item.taxRate || 0;
      const taxAmount = (lineCost * taxRate) / 100;
      const lineTotal = lineCost + taxAmount;

      subtotal += lineCost;
      totalTax += taxAmount;

      return {
        id: uuidv4(),
        invoice_id: invoiceId,
        product_id: item.productId,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
        unit_id: item.unitId,
        conversion_factor: item.conversionFactor,
        quantity: item.quantity,
        base_quantity: item.quantity * item.conversionFactor,
        unit_cost: item.unitCost,
        sale_price: item.salePrice,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: lineTotal,
      };
    });

    const discount = params.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - discount + totalTax);

    const paid = params.paymentType === 'cash' ? finalTotal : params.paidAmount || 0;
    const remaining = Math.max(0, finalTotal - paid);

    const invoice: PurchaseInvoice = {
      id: invoiceId,
      org_id: params.orgId,
      branch_id: params.branchId,
      warehouse_id: params.warehouseId,
      supplier_id: params.supplierId,
      invoice_number: params.supplierInvoiceNumber,
      system_invoice_number: systemInvoiceNumber,
      invoice_date: now,
      subtotal,
      discount_amount: discount,
      tax_amount: totalTax,
      total: finalTotal,
      paid_amount: paid,
      remaining_amount: remaining,
      payment_type: params.paymentType,
      treasury_id: params.treasuryId,
      status: 'completed',
      notes: params.notes,
      created_by: params.userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    await db.transaction(
      'rw',
      [
        db.purchase_invoices,
        db.purchase_invoice_items,
        db.stock_levels,
        db.inventory_transactions,
        db.products,
        db.treasuries,
        db.contacts,
        db.contact_transactions,
        db.sync_queue,
      ],
      async () => {
        // 1. Add invoice and items
        await db.purchase_invoices.add(invoice);
        await db.purchase_invoice_items.bulkAdd(invoiceItems);
        await SyncQueueManager.enqueue('purchase_invoices', invoiceId, 'insert', invoice);

        // 2. Increase stock and update product cost
        for (const item of invoiceItems) {
          await InventoryRepository.recordStockMovement({
            orgId: params.orgId,
            warehouseId: params.warehouseId,
            productId: item.product_id,
            batchNumber: item.batch_number,
            expiryDate: item.expiry_date,
            transactionType: 'purchase',
            quantity: item.quantity,
            unitId: item.unit_id,
            conversionFactor: item.conversion_factor,
            unitCost: item.unit_cost,
            referenceType: 'purchase_invoice',
            referenceId: invoiceId,
            userId: params.userId,
          });

          // Update cost on product card
          await ProductRepository.updateProduct(item.product_id, {
            purchase_price: item.unit_cost / item.conversion_factor, // base unit cost
            sale_price: item.sale_price || undefined,
          });
        }

        // 3. Deduct paid amount from treasury if cash
        if (paid > 0 && params.treasuryId) {
          await TreasuryRepository.adjustBalance(params.treasuryId, -paid);
        }

        // 4. Update Supplier ledger for remaining amount (credit owed to supplier)
        if (remaining > 0) {
          await ContactsRepository.adjustBalance({
            orgId: params.orgId,
            contactId: params.supplierId,
            referenceType: 'purchase_invoice',
            referenceId: invoiceId,
            debit: 0,
            credit: remaining,
            notes: `فاتورة مشتريات رقم ${systemInvoiceNumber} (المورد: ${params.supplierInvoiceNumber})`,
          });
        }
      }
    );

    return invoice;
  }

  // ==========================================
  // PURCHASE INVOICE QUERIES
  // ==========================================

  /**
   * Get all purchase invoices for an organization (newest first)
   */
  public static async getPurchaseInvoices(orgId: string): Promise<PurchaseInvoice[]> {
    return await db.purchase_invoices
      .where('org_id')
      .equals(orgId)
      .reverse()
      .sortBy('created_at');
  }

  /**
   * Get a purchase invoice by id
   */
  public static async getPurchaseInvoice(invoiceId: string): Promise<PurchaseInvoice | undefined> {
    return await db.purchase_invoices.get(invoiceId);
  }

  /**
   * Get the line items of a purchase invoice
   */
  public static async getPurchaseInvoiceItems(invoiceId: string): Promise<PurchaseInvoiceItem[]> {
    return await db.purchase_invoice_items.where('invoice_id').equals(invoiceId).toArray();
  }

  /**
   * Get all purchase returns for an organization (newest first)
   */
  public static async getPurchaseReturns(orgId: string): Promise<PurchaseReturn[]> {
    return await db.purchase_returns
      .where('org_id')
      .equals(orgId)
      .reverse()
      .sortBy('created_at');
  }

  // ==========================================
  // PURCHASE RETURNS
  // ==========================================

  /**
   * Process a purchase return (goods sent back to the supplier):
   * 1. Records the return document
   * 2. Decrements warehouse stock (goods leave the warehouse)
   * 3. Returns the money to treasury when refunded in cash
   * 4. Adjusts the supplier ledger (debit) and reduces the original invoice remaining amount
   */
  public static async createPurchaseReturn(params: {
    orgId: string;
    branchId: string;
    warehouseId: string;
    originalInvoiceId?: string | null;
    supplierId: string;
    items: {
      productId: string;
      unitId: string;
      conversionFactor: number;
      quantity: number;
      unitCost: number;
    }[];
    refundType: 'treasury' | 'credit';
    treasuryId?: string | null;
    userId: string;
    reason?: string;
  }): Promise<PurchaseReturn> {
    if (!params.items || params.items.length === 0) {
      throw new Error('المرتجع يجب أن يحتوي على صنف واحد على الأقل');
    }
    if (params.refundType === 'treasury' && !params.treasuryId) {
      throw new Error('اختر الخزينة التي سيُرجع منها المبلغ المسترد.');
    }

    const now = new Date().toISOString();
    const returnId = uuidv4();
    const count = await db.purchase_returns.where('branch_id').equals(params.branchId).count();
    const returnNumber = `PRET-${String(count + 1).padStart(6, '0')}`;

    const total = params.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    if (!(total > 0)) {
      throw new Error('قيمة المرتجع يجب أن تكون أكبر من صفر.');
    }

    const returnDoc: PurchaseReturn = {
      id: returnId,
      org_id: params.orgId,
      branch_id: params.branchId,
      warehouse_id: params.warehouseId,
      original_invoice_id: params.originalInvoiceId,
      supplier_id: params.supplierId,
      return_number: returnNumber,
      return_date: now,
      total,
      refunded_amount: total,
      treasury_id: params.refundType === 'treasury' ? params.treasuryId : null,
      reason: params.reason,
      created_by: params.userId,
      created_at: now,
      sync_status: 'pending',
    };

    await db.transaction(
      'rw',
      [
        db.purchase_returns,
        db.purchase_invoices,
        db.stock_levels,
        db.inventory_transactions,
        db.treasuries,
        db.contacts,
        db.contact_transactions,
        db.sync_queue,
      ],
      async () => {
        // 1. Save return document
        await db.purchase_returns.add(returnDoc);
        await SyncQueueManager.enqueue('purchase_returns', returnId, 'insert', returnDoc);

        // 2. Decrement stock (goods leave the warehouse back to the supplier)
        for (const item of params.items) {
          const result = await InventoryRepository.recordStockMovement({
            orgId: params.orgId,
            warehouseId: params.warehouseId,
            productId: item.productId,
            transactionType: 'purchase_return',
            quantity: -item.quantity,
            unitId: item.unitId,
            conversionFactor: item.conversionFactor,
            unitCost: item.unitCost,
            referenceType: 'purchase_invoice',
            referenceId: returnId,
            userId: params.userId,
          });

          if (!result.success) {
            throw new Error(result.error || 'عجز في المخزون أثناء تنفيذ المرتجع.');
          }
        }

        // 3. Refund cash back to treasury when supplier pays us in cash
        if (params.refundType === 'treasury' && params.treasuryId && total > 0) {
          await TreasuryRepository.adjustBalance(params.treasuryId, total);
        }

        // 4. Adjust supplier ledger: the return is a debit against the supplier
        await ContactsRepository.adjustBalance({
          orgId: params.orgId,
          contactId: params.supplierId,
          referenceType: 'purchase_return',
          referenceId: returnId,
          debit: total,
          credit: 0,
          notes: `مرتجع مشتريات رقم ${returnNumber}`,
        });

        // 5. Reduce the original invoice remaining amount when it still carries credit
        if (params.originalInvoiceId) {
          const original = await db.purchase_invoices.get(params.originalInvoiceId);
          if (original && original.status === 'completed') {
            const updatedInvoice: PurchaseInvoice = {
              ...original,
              remaining_amount: Math.max(0, original.remaining_amount - total),
              updated_at: now,
              sync_status: 'pending',
            };
            await db.purchase_invoices.put(updatedInvoice);
            await SyncQueueManager.enqueue('purchase_invoices', original.id, 'update', updatedInvoice);
          }
        }
      }
    );

    return returnDoc;
  }
}
