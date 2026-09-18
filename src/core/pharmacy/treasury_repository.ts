/**
 * Treasury data access: treasuries, cash balances, expenses and their
 * categories. Read-only listing + creation through PostgREST.
 */

import { supabase } from '@/core/supabase/supabase_client';
import {
  DEFAULT_PAGE_SIZE,
  nameSearchFilter,
  pageToRange,
  throwIfError,
  type PageParams,
} from './helpers';
import type { Expense, ExpenseCategory, PaymentVoucher, Treasury, TablesInsert } from '@/types/pharmacy';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TreasuryListParams extends PageParams {
  branchId?: string | null;
  search?: string;
}

export interface VoucherListParams extends PageParams {
  branchId: string;
  search?: string;
}

export interface ExpenseListParams extends PageParams {
  branchId?: string | null;
  categoryId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export const TreasuryRepository = {
  async treasuries(params: TreasuryListParams = {}): Promise<{ items: Treasury[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, branchId, search } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('treasuries')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('is_main', { ascending: false })
      .range(from, to);

    if (branchId) query = query.eq('branch_id', branchId);
    if (search?.trim()) query = query.or(nameSearchFilter(search, ['name', 'code']));

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async createTreasury(input: TablesInsert<'treasuries'>): Promise<Treasury> {
    const { data, error } = await supabase.from('treasuries').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء الخزينة.');
    return data;
  },

  async expenseCategories(branchId?: string | null): Promise<ExpenseCategory[]> {
    let query = supabase
      .from('expense_categories')
      .select('*')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('name');
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  },

  async expenses(params: ExpenseListParams = {}): Promise<{ items: Expense[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, branchId, categoryId, fromDate, toDate } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('expense_date', { ascending: false })
      .range(from, to);

    if (branchId) query = query.eq('branch_id', branchId);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (fromDate) query = query.gte('expense_date', fromDate);
    if (toDate) query = query.lte('expense_date', toDate);

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async createExpense(input: TablesInsert<'expenses'>): Promise<Expense> {
    const { data, error } = await supabase.from('expenses').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم تسجيل المصروف.');
    return data;
  },

  async listVouchers(params: VoucherListParams): Promise<PagedResult<PaymentVoucher>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('payment_vouchers')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('voucher_date', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['voucher_number', 'party_name', 'reference_number', 'description']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },
};