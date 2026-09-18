/**
 * Sales data access: invoice listing with search + status filters.
 * Read-only queries against the live pharmacy data.
 */

import { supabase } from '@/core/supabase/supabase_client';
import {
  DEFAULT_PAGE_SIZE,
  nameSearchFilter,
  pageToRange,
  throwIfError,
  type PageParams,
} from './helpers';
import type { CashierShift, InvoiceReturn, Medicine, SaleInvoice, TablesInsert } from '@/types/pharmacy';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesListParams extends PageParams {
  branchId: string;
  search?: string;
}

export interface PosLine {
  medicineId: string;
  medicineName: string;
  barcode: string | null;
  unitLevel: number;
  unitName: string;
  quantity: number;
  unitPricePiasters: number;
}

export interface RecordSaleInput {
  accountId: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  doctorId: string | null;
  lines: PosLine[];
  subtotalPiasters: number;
  discountPiasters: number;
  taxPiasters: number;
  totalPiasters: number;
  paidPiasters: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'mixed';
  cashReceivedPiasters: number;
  cardReceivedPiasters: number;
  notes: string | null;
}

export interface SaleInvoiceListParams extends PageParams {
  branchId?: string | null;
  search?: string;
  paymentStatus?: string | null;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface SaleInvoiceListResult {
  items: SaleInvoice[];
  total: number;
  page: number;
  pageSize: number;
}

export const SalesRepository = {
  async listInvoices(params: SaleInvoiceListParams = {}): Promise<SaleInvoiceListResult> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('sale_invoices')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.paymentStatus) query = query.eq('payment_status', params.paymentStatus);
    if (params.status) query = query.eq('status', params.status);
    if (params.fromDate) query = query.gte('created_at', params.fromDate);
    if (params.toDate) query = query.lte('created_at', params.toDate);
    if (params.search?.trim()) {
      query = query.or(
        nameSearchFilter(params.search, ['invoice_number', 'customer_name', 'cashier_name'])
      );
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async getInvoice(id: string): Promise<SaleInvoice | null> {
    const { data, error } = await supabase.from('sale_invoices').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data;
  },

  async createInvoice(input: TablesInsert<'sale_invoices'>): Promise<SaleInvoice> {
    const { data, error } = await supabase.from('sale_invoices').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء الفاتورة.');
    return data;
  },

  async listReturns(params: SalesListParams): Promise<PagedResult<InvoiceReturn>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('invoice_returns')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['return_number', 'customer_name', 'reason_notes']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listShifts(params: SalesListParams): Promise<PagedResult<CashierShift>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('cashier_shifts')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('opened_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['cashier_name', 'treasury_name', 'shift_number']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listForPos(branchId: string, search = '', limit = 60): Promise<Medicine[]> {
    let query = supabase
      .from('medicines')
      .select('*')
      .eq('is_deleted', false)
      .eq('branch_id', branchId)
      .order('name', { ascending: true })
      .limit(limit);

    if (search.trim()) {
      const term = search.trim();
      if (/^[0-9]+$/.test(term)) {
        query = query.or(`name.ilike.%${term}%,generic_name.ilike.%${term}%,barcode.ilike.%${term}%`);
      } else {
        query = query.or(`name.ilike.%${term}%,generic_name.ilike.%${term}%`);
      }
    }

    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  },

  async recordSale(input: RecordSaleInput): Promise<SaleInvoice> {
    const now = new Date().toISOString();
    let invoice: SaleInvoice | null = null;

    try {
      const invoiceNumber = await this.nextInvoiceNumber(input.branchId);

      const invoicePayload: TablesInsert<'sale_invoices'> = {
        id: crypto.randomUUID(),
        account_id: input.accountId,
        branch_id: input.branchId,
        invoice_number: invoiceNumber,
        cashier_id: input.cashierId || null,
        cashier_name: input.cashierName || null,
        customer_id: input.customerId,
        customer_name: input.customerName ?? 'عميل نقدي',
        customer_phone: input.customerPhone,
        customer_type: input.customerId ? 'customer' : '',
        doctor_id: input.doctorId,
        payment_method: input.paymentMethod,
        payment_status:
          input.paymentMethod === 'credit'
            ? 'credit'
            : input.paidPiasters >= input.totalPiasters
              ? 'paid'
              : 'partial',
        status: 'completed',
        total_quantity: input.lines.reduce((acc, l) => acc + l.quantity, 0),
        subtotal_amount_piasters: input.subtotalPiasters,
        discount_amount_piasters: input.discountPiasters,
        tax_amount_piasters: input.taxPiasters,
        total_amount_piasters: input.totalPiasters,
        paid_amount_piasters: input.paidPiasters,
        remaining_amount_piasters: input.paymentMethod === 'credit' ? input.totalPiasters : Math.max(0, input.totalPiasters - input.paidPiasters),
        cash_received_piasters: input.cashReceivedPiasters,
        card_received_piasters: input.cardReceivedPiasters,
        notes: input.notes,
        created_by: input.cashierId || null,
        created_by_name: input.cashierName || null,
        created_at: now,
        last_modified: now,
        is_deleted: false,
        sync_version: 1,
      };

      invoice = await this.createInvoice(invoicePayload);
      const invoiceId = invoice.id;

      const items = input.lines.map((l): TablesInsert<'sale_invoice_items'> => ({
        id: crypto.randomUUID(),
        account_id: input.accountId,
        branch_id: input.branchId,
        invoice_id: invoiceId,
        medicine_id: l.medicineId,
        medicine_name: l.medicineName,
        barcode: l.barcode,
        batch_number: null,
        expiry_date: null,
        unit_level: l.unitLevel,
        unit_name: l.unitName,
        quantity: l.quantity,
        unit_price_piasters: l.unitPricePiasters,
        total_price_piasters: l.unitPricePiasters * l.quantity,
        discount_piasters: 0,
        created_at: now,
        last_modified: now,
        is_deleted: false,
        sync_version: 1,
        created_by: input.cashierId || null,
        created_by_name: input.cashierName || null,
      }));

      const { error: itemsError } = await supabase.from('sale_invoice_items').insert(items);
      throwIfError(itemsError);

      const transactions = input.lines.map((l): TablesInsert<'inventory_transactions'> => ({
        id: crypto.randomUUID(),
        account_id: input.accountId,
        branch_id: input.branchId,
        medicine_id: l.medicineId,
        medicine_name: l.medicineName,
        transaction_type: 'sale',
        quantity_change: -l.quantity,
        unit_level: l.unitLevel,
        unit_name: l.unitName,
        reference_id: invoiceId,
        reference_number: invoiceNumber,
        batch_number: null,
        buy_price_piasters: 0,
        sell_price_piasters: l.unitPricePiasters,
        created_by: input.cashierId || null,
        created_by_name: input.cashierName || null,
        created_at: now,
        last_modified: now,
        is_deleted: false,
        sync_version: 1,
      }));

      const { error: txError } = await supabase.from('inventory_transactions').insert(transactions);
      throwIfError(txError);

      if (input.customerId && input.paymentMethod === 'credit') {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('balance_piasters')
          .eq('id', input.customerId)
          .maybeSingle();
        throwIfError(customerError);
        if (customer) {
          const newBalance = Number(customer.balance_piasters ?? 0) + (input.totalPiasters - input.paidPiasters);
          const { error: balErr } = await supabase
            .from('customers')
            .update({ balance_piasters: newBalance, last_modified: now })
            .eq('id', input.customerId);
          throwIfError(balErr);
        }
      }

      return invoice;
    } catch (err) {
      if (invoice?.id) {
        await supabase
          .from('sale_invoices')
          .update({ is_deleted: true, last_modified: new Date().toISOString() })
          .eq('id', invoice.id);
      }
      throw err instanceof Error ? err : new Error('تعذّر إتمام عملية البيع.');
    }
  },

  async nextInvoiceNumber(branchId: string): Promise<string> {
    const { data: rpcNumber, error: rpcErr } = await supabase.rpc('get_next_branch_invoice_number', {
      p_branch_id: branchId,
    });
    if (!rpcErr && rpcNumber) return String(rpcNumber);

    const { data: counter, error } = await supabase
      .from('receipt_counters')
      .select('*')
      .eq('branch_id', branchId)
      .eq('counter_type', 'sale')
      .maybeSingle();
    if (!error && counter) {
      const next = (Number(counter.last_number ?? 0) || 0) + 1;
      const number = `${counter.prefix ?? 'INV-'}${String(next).padStart(5, '0')}`;
      void supabase
        .from('receipt_counters')
        .update({ last_number: next, last_modified: new Date().toISOString() })
        .eq('id', counter.id);
      return number;
    }

    const { data: maxRow, error: maxErr } = await supabase
      .from('sale_invoices')
      .select('invoice_number')
      .eq('branch_id', branchId)
      .eq('is_deleted', false)
      .order('invoice_number', { ascending: false })
      .limit(1);
    if (!maxErr && maxRow?.[0]?.invoice_number) {
      return `${maxRow[0].invoice_number}-${Date.now().toString().slice(-4)}`;
    }
    return `INV-${Date.now()}`;
  },
};