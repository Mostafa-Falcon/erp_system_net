/**
 * Inventory data access: item batches, their quantities and expiry tracking.
 * Batch medicine names are resolved with a projected id -> name map.
 */

import { supabase } from '@/core/supabase/supabase_client';
import {
  DEFAULT_PAGE_SIZE,
  nameSearchFilter,
  pageToRange,
  throwIfError,
  type PageParams,
} from './helpers';
import type {
  DamagedStockLog,
  InventoryAudit,
  InventoryTransaction,
  ItemBatch,
  StockAdjustment,
  StockTransfer,
} from '@/types/pharmacy';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventoryListParams extends PageParams {
  branchId: string;
  search?: string;
}

export type BatchExpiryFilter = 'all' | 'expired' | 'expiring' | 'ok';

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  purchase: 'شراء',
  sale: 'بيع',
  sale_return: 'مرتجع بيع',
  purchase_return: 'مرتجع شراء',
  transfer_in: 'تحويل وارد',
  transfer_out: 'تحويل صادر',
  initial: 'افتتاحي',
  damaged: 'تالف',
  adjustment: 'تسوية',
};

export interface BatchListParams extends PageParams {
  branchId: string;
  search?: string;
  expiryFilter?: BatchExpiryFilter;
  expiringDays?: number;
}

export interface BatchWithName extends ItemBatch {
  medicine_name: string | null;
}

const loadMedicineNames = async (medicineIds: string[]): Promise<Map<string, string | null>> => {
  const names = new Map<string, string | null>();
  const unique = Array.from(new Set(medicineIds));
  if (unique.length === 0) return names;

  const CHUNK = 100;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('medicines')
      .select('id, name')
      .in('id', chunk)
      .eq('is_deleted', false);
    throwIfError(error);
    for (const row of data ?? []) names.set(row.id, row.name);
  }
  return names;
};

export const InventoryRepository = {
  async listBatches(params: BatchListParams): Promise<{ items: BatchWithName[]; total: number; page: number; pageSize: number }> {
    const { branchId, search, expiryFilter = 'all', expiringDays = 90, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('item_batches')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', branchId)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .range(from, to);

    const now = new Date();
    if (expiryFilter === 'expired') {
      query = query.not('expiry_date', 'is', null).lt('expiry_date', now.toISOString());
    } else if (expiryFilter === 'expiring') {
      const until = new Date(now.getTime() + expiringDays * 86_400_000).toISOString();
      query = query.not('expiry_date', 'is', null).gt('expiry_date', now.toISOString()).lt('expiry_date', until);
    } else if (expiryFilter === 'ok') {
      const after = new Date(now.getTime() + expiringDays * 86_400_000).toISOString();
      query = query.or(`expiry_date.is.null,expiry_date.gt.${after}`);
    }

    if (search?.trim()) {
      query = query.or(nameSearchFilter(search, ['batch_number']));
    }

    const { data, error, count } = await query;
    throwIfError(error);

    const ids = (data ?? []).map((b) => b.medicine_id);
    const names = await loadMedicineNames(ids);

    const items = (data ?? []).map((batch) => ({
      ...batch,
      medicine_name: names.get(batch.medicine_id) ?? null,
    }));

    return { items, total: count ?? 0, page, pageSize };
  },

  async listBatchesForMedicine(medicineId: string, branchId: string, includeExpired = false): Promise<ItemBatch[]> {
    let query = supabase
      .from('item_batches')
      .select('*')
      .eq('is_deleted', false)
      .eq('medicine_id', medicineId)
      .eq('branch_id', branchId)
      .order('expiry_date', { ascending: false, nullsFirst: false });
    if (!includeExpired) {
      const now = new Date().toISOString();
      query = query.or(`expiry_date.is.null,expiry_date.gt.${now}`);
    }
    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  },

  async countExpiring(branchId?: string | null, expiringDays = 90): Promise<number> {
    const until = new Date(Date.now() + expiringDays * 86_400_000).toISOString();
    let query = supabase
      .from('item_batches')
      .select('id', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', until);
    if (branchId) query = query.eq('branch_id', branchId);
    const { count, error } = await query;
    throwIfError(error);
    return count ?? 0;
  },

  async listTransactions(params: InventoryListParams): Promise<PagedResult<InventoryTransaction>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('inventory_transactions')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['medicine_name', 'reference_number', 'batch_number']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listAdjustments(params: InventoryListParams): Promise<PagedResult<StockAdjustment>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('stock_adjustments')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['adjustment_number', 'adjustment_type', 'notes']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listAudits(params: InventoryListParams): Promise<PagedResult<InventoryAudit>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('inventory_audits')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['audit_number', 'notes']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listDamaged(params: InventoryListParams): Promise<PagedResult<DamagedStockLog>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('damaged_stock_logs')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', params.branchId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['medicine_name', 'reason', 'batch_number']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listTransfers(params: InventoryListParams): Promise<PagedResult<StockTransfer>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('stock_transfers')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .or(`from_branch_id.eq.${params.branchId},to_branch_id.eq.${params.branchId}`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['transfer_number', 'notes']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },
};