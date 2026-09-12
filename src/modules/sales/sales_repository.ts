import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import { InventoryRepository } from '@/modules/inventory/inventory_repository';
import { TreasuryRepository } from '@/modules/treasury/treasury_repository';
import { ContactsRepository } from '@/modules/contacts/contacts_repository';
import type {
  CashierShift,
  SalesInvoice,
  SalesInvoiceItem,
  SalesReturn,
  InvoicePaymentType,
} from '@/types';

export class SalesRepository {
  // ==========================================
  // CASHIER SHIFTS
  // ==========================================

  /**
   * Get currently open shift for a user/branch
   */
  public static async getCurrentOpenShift(userId: string, branchId: string): Promise<CashierShift | undefined> {
    return await db.cashier_shifts
      .where('user_id')
      .equals(userId)
      .and((s) => s.branch_id === branchId && s.status === 'open')
      .first();
  }

  /**
   * Open a new cashier shift
   */
  public static async openShift(params: {
    orgId: string;
    branchId: string;
    userId: string;
    treasuryId: string;
    openingBalance: number;
  }): Promise<CashierShift> {
    const existing = await this.getCurrentOpenShift(params.userId, params.branchId);
    if (existing) {
      throw new Error('يوجد وردية مفتوحة بالفعل لهذا الكاشير');
    }

    const shiftCount = await db.cashier_shifts.where('branch_id').equals(params.branchId).count();
    const now = new Date().toISOString();
    const shiftId = uuidv4();

    const shift: CashierShift = {
      id: shiftId,
      org_id: params.orgId,
      branch_id: params.branchId,
      user_id: params.userId,
      treasury_id: params.treasuryId,
      shift_number: shiftCount + 1,
      opened_at: now,
      opening_balance: params.openingBalance,
      total_sales_cash: 0,
      total_sales_card: 0,
      total_sales_credit: 0,
      total_returns_cash: 0,
      total_expenses: 0,
      expected_closing_balance: params.openingBalance,
      status: 'open',
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.cashier_shifts, db.sync_queue], async () => {
      await db.cashier_shifts.add(shift);
      await SyncQueueManager.enqueue('cashier_shifts', shiftId, 'insert', shift);
    });

    return shift;
  }

  /**
   * Close an open cashier shift with cash reconciliation
   */
  public static async closeShift(shiftId: string, actualClosingBalance: number, notes?: string): Promise<CashierShift> {
    const shift = await db.cashier_shifts.get(shiftId);
    if (!shift || shift.status === 'closed') {
      throw new Error('الوردية غير موجودة أو تم إغلاقها مسبقاً');
    }

    const now = new Date().toISOString();
    const difference = actualClosingBalance - shift.expected_closing_balance;

    const updatedShift: CashierShift = {
      ...shift,
      actual_closing_balance: actualClosingBalance,
      difference,
      closed_at: now,
      status: 'closed',
      notes,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.cashier_shifts, db.sync_queue], async () => {
      await db.cashier_shifts.put(updatedShift);
      await SyncQueueManager.enqueue('cashier_shifts', shiftId, 'update', updatedShift);
    });

    return updatedShift;
  }

  // ==========================================
  // SALES INVOICES
  // ==========================================

  /**
   * Generate next invoice number
   */
  public static async generateInvoiceNumber(branchId: string): Promise<string> {
    const count = await db.sales_invoices.where('branch_id').equals(branchId).count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Create Sales Invoice with full transaction orchestration:
   * 1. Records invoice & invoice items
   * 2. Decrements warehouse stock
   * 3. Adjusts treasury balance for cash/card
   * 4. Adjusts customer credit balance for deferred payments
   * 5. Updates cashier shift running totals
   * 6. Enqueues all operations to Outbox Sync Queue
   */
  public static async createSalesInvoice(params: {
    orgId: string;
    branchId: string;
    warehouseId: string;
    shiftId?: string | null;
    customerId?: string | null;
    items: {
      productId: string;
      batchId?: string | null;
      unitId: string;
      conversionFactor: number;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      discountAmount?: number;
      taxRate?: number;
    }[];
    discountAmount?: number;
    discountPercent?: number;
    paymentType: InvoicePaymentType;
    cashAmount?: number;
    cardAmount?: number;
    treasuryId: string;
    userId: string;
    notes?: string;
  }): Promise<SalesInvoice> {
    if (!params.items || params.items.length === 0) {
      throw new Error('الفاتورة يجب أن تحتوي على صنف واحد على الأقل');
    }

    const now = new Date().toISOString();
    const invoiceId = uuidv4();
    const invoiceNumber = await this.generateInvoiceNumber(params.branchId);

    // Calculate line items
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalTax = 0;

    const invoiceItems: SalesInvoiceItem[] = params.items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discount = item.discountAmount || 0;
      const taxableAmount = Math.max(0, lineSubtotal - discount);
      const taxRate = item.taxRate || 0;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const lineTotal = taxableAmount + taxAmount;

      subtotal += lineSubtotal;
      totalItemDiscount += discount;
      totalTax += taxAmount;

      return {
        id: uuidv4(),
        invoice_id: invoiceId,
        product_id: item.productId,
        batch_id: item.batchId,
        unit_id: item.unitId,
        conversion_factor: item.conversionFactor,
        quantity: item.quantity,
        base_quantity: item.quantity * item.conversionFactor,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount_amount: discount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: lineTotal,
      };
    });

    const overallDiscount = params.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - totalItemDiscount - overallDiscount + totalTax);

    // Payment calculations
    let cashPaid = 0;
    let cardPaid = 0;

    if (params.paymentType === 'cash') {
      cashPaid = finalTotal;
    } else if (params.paymentType === 'card') {
      cardPaid = finalTotal;
    } else if (params.paymentType === 'split') {
      cashPaid = params.cashAmount || 0;
      cardPaid = params.cardAmount || 0;
    }

    const totalPaid = cashPaid + cardPaid;
    const remainingAmount = Math.max(0, finalTotal - totalPaid);

    if (remainingAmount > 0 && !params.customerId) {
      throw new Error('لا يمكن تسجيل فاتورة آجلة أو بها متبقي بدون تحديد العميل');
    }

    const invoice: SalesInvoice = {
      id: invoiceId,
      org_id: params.orgId,
      branch_id: params.branchId,
      warehouse_id: params.warehouseId,
      shift_id: params.shiftId,
      invoice_number: invoiceNumber,
      invoice_date: now,
      customer_id: params.customerId,
      subtotal,
      discount_amount: totalItemDiscount + overallDiscount,
      discount_percent: params.discountPercent || 0,
      tax_amount: totalTax,
      total: finalTotal,
      paid_amount: totalPaid,
      remaining_amount: remainingAmount,
      payment_type: params.paymentType,
      cash_amount: cashPaid,
      card_amount: cardPaid,
      treasury_id: params.treasuryId,
      status: 'completed',
      notes: params.notes,
      created_by: params.userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    // Execute atomic save
    await db.transaction(
      'rw',
      [
        db.sales_invoices,
        db.sales_invoice_items,
        db.stock_levels,
        db.inventory_transactions,
        db.treasuries,
        db.contacts,
        db.contact_transactions,
        db.cashier_shifts,
        db.sync_queue,
      ],
      async () => {
        // 1. Save Invoice & Items
        await db.sales_invoices.add(invoice);
        await db.sales_invoice_items.bulkAdd(invoiceItems);
        await SyncQueueManager.enqueue('sales_invoices', invoiceId, 'insert', invoice);

        // 2. Decrement Stock for each item
        for (const item of invoiceItems) {
          const result = await InventoryRepository.recordStockMovement({
            orgId: params.orgId,
            warehouseId: params.warehouseId,
            productId: item.product_id,
            batchId: item.batch_id,
            transactionType: 'sale',
            quantity: -item.quantity,
            unitId: item.unit_id,
            conversionFactor: item.conversion_factor,
            unitCost: item.unit_cost,
            referenceType: 'sale_invoice',
            referenceId: invoiceId,
            userId: params.userId,
          });

          if (!result.success) {
            throw new Error(result.error || 'عجز في المخزون أثناء إتمام الفاتورة');
          }
        }

        // 3. Update Treasury Balance for Cash
        if (cashPaid > 0) {
          await TreasuryRepository.adjustBalance(params.treasuryId, cashPaid);
        }

        // 4. Update Customer Credit Balance for remaining amount
        if (remainingAmount > 0 && params.customerId) {
          await ContactsRepository.adjustBalance({
            orgId: params.orgId,
            contactId: params.customerId,
            referenceType: 'sale_invoice',
            referenceId: invoiceId,
            debit: remainingAmount,
            credit: 0,
            notes: `فاتورة مبيعات آجل رقم ${invoiceNumber}`,
          });
        }

        // 5. Update Cashier Shift running balances
        if (params.shiftId) {
          const shift = await db.cashier_shifts.get(params.shiftId);
          if (shift && shift.status === 'open') {
            const updatedShift: CashierShift = {
              ...shift,
              total_sales_cash: shift.total_sales_cash + cashPaid,
              total_sales_card: shift.total_sales_card + cardPaid,
              total_sales_credit: shift.total_sales_credit + remainingAmount,
              expected_closing_balance: shift.expected_closing_balance + cashPaid,
              sync_status: 'pending',
            };
            await db.cashier_shifts.put(updatedShift);
            await SyncQueueManager.enqueue('cashier_shifts', shift.id, 'update', updatedShift);
          }
        }
      }
    );

    return invoice;
  }

  /**
   * Process Sales Return
   */
  public static async createSalesReturn(params: {
    orgId: string;
    branchId: string;
    warehouseId: string;
    originalInvoiceId?: string | null;
    shiftId?: string | null;
    customerId?: string | null;
    items: {
      productId: string;
      unitId: string;
      conversionFactor: number;
      quantity: number;
      unitPrice: number;
      unitCost: number;
    }[];
    treasuryId: string;
    userId: string;
    reason?: string;
  }): Promise<SalesReturn> {
    const now = new Date().toISOString();
    const returnId = uuidv4();
    const count = await db.sales_returns.where('branch_id').equals(params.branchId).count();
    const returnNumber = `RET-${String(count + 1).padStart(6, '0')}`;

    const total = params.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    const returnDoc: SalesReturn = {
      id: returnId,
      org_id: params.orgId,
      branch_id: params.branchId,
      warehouse_id: params.warehouseId,
      original_invoice_id: params.originalInvoiceId,
      shift_id: params.shiftId,
      return_number: returnNumber,
      return_date: now,
      customer_id: params.customerId,
      total,
      refunded_amount: total,
      treasury_id: params.treasuryId,
      reason: params.reason,
      created_by: params.userId,
      created_at: now,
      sync_status: 'pending',
    };

    await db.transaction(
      'rw',
      [
        db.sales_returns,
        db.stock_levels,
        db.inventory_transactions,
        db.treasuries,
        db.cashier_shifts,
        db.sync_queue,
      ],
      async () => {
        await db.sales_returns.add(returnDoc);
        await SyncQueueManager.enqueue('sales_returns', returnId, 'insert', returnDoc);

        // 1. Return stock to warehouse
        for (const item of params.items) {
          await InventoryRepository.recordStockMovement({
            orgId: params.orgId,
            warehouseId: params.warehouseId,
            productId: item.productId,
            transactionType: 'sale_return',
            quantity: item.quantity,
            unitId: item.unitId,
            conversionFactor: item.conversionFactor,
            unitCost: item.unitCost,
            referenceType: 'sale_invoice',
            referenceId: returnId,
            userId: params.userId,
          });
        }

        // 2. Refund from treasury
        await TreasuryRepository.adjustBalance(params.treasuryId, -total);

        // 3. Update shift
        if (params.shiftId) {
          const shift = await db.cashier_shifts.get(params.shiftId);
          if (shift && shift.status === 'open') {
            const updatedShift: CashierShift = {
              ...shift,
              total_returns_cash: shift.total_returns_cash + total,
              expected_closing_balance: shift.expected_closing_balance - total,
              sync_status: 'pending',
            };
            await db.cashier_shifts.put(updatedShift);
            await SyncQueueManager.enqueue('cashier_shifts', shift.id, 'update', updatedShift);
          }
        }
      }
    );

    return returnDoc;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Get all sales invoices for an organization (newest first)
   */
  public static async getSalesInvoices(orgId: string): Promise<SalesInvoice[]> {
    return await db.sales_invoices
      .where('org_id')
      .equals(orgId)
      .reverse()
      .sortBy('created_at');
  }

  /**
   * Get the line items of a sales invoice
   */
  public static async getSalesInvoiceItems(invoiceId: string): Promise<SalesInvoiceItem[]> {
    return await db.sales_invoice_items.where('invoice_id').equals(invoiceId).toArray();
  }

  /**
   * Get all sales returns for an organization (newest first)
   */
  public static async getSalesReturns(orgId: string): Promise<SalesReturn[]> {
    return await db.sales_returns
      .where('org_id')
      .equals(orgId)
      .reverse()
      .sortBy('created_at');
  }

  /**
   * Get cashier shifts for a branch (newest first)
   */
  public static async getShifts(branchId: string): Promise<CashierShift[]> {
    return await db.cashier_shifts
      .where('branch_id')
      .equals(branchId)
      .reverse()
      .sortBy('opened_at');
  }
}
