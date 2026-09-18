/**
 * Purchases data access: invoice listing with search + status filters.
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
import type { PurchaseInvoice, PurchaseOrder, PurchaseReturn, TablesInsert } from '@/types/pharmacy';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PurchaseListParams extends PageParams {
  branchId: string;
  search?: string;
}

export interface PurchaseInvoiceListParams extends PageParams {
  branchId?: string | null;
  search?: string;
  status?: string | null;
  paymentType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface PurchaseInvoiceListResult {
  items: PurchaseInvoice[];
  total: number;
  page: number;
  pageSize: number;
}

export const PurchasesRepository = {
  async listInvoices(params: PurchaseInvoiceListParams = {}): Promise<PurchaseInvoiceListResult> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('purchase_invoices')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('invoice_date', { ascending: false })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.status) query = query.eq('status', params.status);
    if (params.paymentType) query = query.eq('payment_type', params.paymentType);
    if (params.fromDate) query = query.gte('invoice_date', params.fromDate);
    if (params.toDate) query = query.lte('invoice_date', params.toDate);
    if (params.search?.trim()) {
      query = query.or(
        nameSearchFilter(params.search, ['invoice_number', 'supplier_invoice_number', 'supplier_name'])
      );
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async getInvoice(id: string): Promise<PurchaseInvoice | null> {
    const { data, error } = await supabase.from('purchase_invoices').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data;
  },

  async createInvoice(input: TablesInsert<'purchase_invoices'>): Promise<PurchaseInvoice> {
    const { data, error } = await supabase.from('purchase_invoices').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء فاتورة الشراء.');
    return data;
  },

  async listOrders(params: PurchaseListParams): Promise<PagedResult<PurchaseOrder>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('purchase_orders')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['order_number', 'supplier_name', 'notes']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listReturns(params: PurchaseListParams): Promise<PagedResult<PurchaseReturn>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('purchase_returns')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['return_number', 'supplier_name', 'reason_notes']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },
};