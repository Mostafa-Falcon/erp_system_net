/**
 * Accounting data access: chart of accounts with type filtering and summary.
 * Read-only listing against the live chart of accounts.
 */

import { supabase } from '@/core/supabase/supabase_client';
import {
  DEFAULT_PAGE_SIZE,
  nameSearchFilter,
  pageToRange,
  throwIfError,
  type PageParams,
} from './helpers';
import type { ChartOfAccount, JournalEntry } from '@/types/pharmacy';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JournalListParams extends PageParams {
  branchId: string;
  search?: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'أصول',
  liability: 'خصوم',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

export interface AccountListParams extends PageParams {
  search?: string;
  accountType?: AccountType | 'all';
  activeOnly?: boolean;
}

export interface AccountListResult {
  items: ChartOfAccount[];
  total: number;
  page: number;
  pageSize: number;
}

export const AccountingRepository = {
  async list(params: AccountListParams = {}): Promise<AccountListResult> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search, accountType = 'all', activeOnly } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('chart_of_accounts')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('code', { ascending: true })
      .range(from, to);

    if (accountType !== 'all') query = query.eq('account_type', accountType);
    if (activeOnly) query = query.eq('is_active', true);
    if (search?.trim()) query = query.or(nameSearchFilter(search, ['name', 'code']));

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async balancesByType(): Promise<Record<AccountType, number>> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('account_type, balance_piasters')
      .eq('is_deleted', false)
      .eq('is_active', true);
    throwIfError(error);

    const result: Record<AccountType, number> = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    };
    for (const row of data ?? []) {
      const type = row.account_type as AccountType;
      if (type in result) result[type] += Number(row.balance_piasters ?? 0);
    }
    return result;
  },

  async create(input: {
    accountId: string;
    code: string;
    name: string;
    account_type: AccountType;
    parent_id?: string | null;
  }): Promise<ChartOfAccount> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        id: crypto.randomUUID(),
        account_id: input.accountId,
        code: input.code,
        name: input.name,
        account_type: input.account_type,
        parent_id: input.parent_id ?? null,
        balance_piasters: 0,
        is_active: true,
        is_deleted: false,
        sync_version: 1,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      })
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء الحساب.');
    return data;
  },

  async listJournalEntries(params: JournalListParams): Promise<PagedResult<JournalEntry>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('entry_date', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['entry_number', 'description', 'reference_id']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },
};