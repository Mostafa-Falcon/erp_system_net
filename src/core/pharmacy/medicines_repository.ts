/**
 * Medicines catalog data access.
 *
 * The pharmacy tenant is resolved by RLS; callers only supply the active
 * branch for branch-scoped queries.
 */

import { supabase } from '@/core/supabase/supabase_client';
import {
  DEFAULT_PAGE_SIZE,
  nameSearchFilter,
  pageToRange,
  throwIfError,
  type PageParams,
} from './helpers';
import type { Medicine, MedicineInsert, MedicineUpdate, MedicineUnitLevel } from '@/types/pharmacy';

export interface MedicineListParams extends PageParams {
  branchId?: string | null;
  search?: string;
  categoryId?: string | null;
  brandId?: string | null;
  therapeuticGroupId?: string | null;
  productTypeId?: string | null;
  lowStockOnly?: boolean;
  includeDeleted?: boolean;
}

export interface MedicineListResult {
  items: Medicine[];
  total: number;
  page: number;
  pageSize: number;
}

export type MedicineQuickFilter = 'all' | 'low_stock' | 'out_of_stock' | 'expiring_soon';

export interface MedicineFilteredParams {
  branchId: string;
  filter?: MedicineQuickFilter;
  search?: string;
  page?: number;
  pageSize?: number;
  expiringDays?: number;
}

const MEDICINE_SEARCH_COLUMNS = ['name', 'name_ar', 'name_en', 'generic_name', 'barcode'];

/**
 * Resolves the ids of medicines whose base-unit stock has dropped to or below
 * their reorder level. PostgREST cannot compare two columns in a single filter,
 * so the comparison runs in memory over a projected, indexed query.
 */
const findLowStockIds = async (
  branchId: string,
  search?: string,
  activeOnly = false
): Promise<string[]> => {
  let query = supabase
    .from('medicines')
    .select('id, total_quantity_base_units, min_reorder_level')
    .eq('is_deleted', false)
    .eq('branch_id', branchId)
    .gt('total_quantity_base_units', 0)
    .gt('min_reorder_level', 0);

  if (activeOnly) query = query.eq('is_active', true);
  if (search?.trim()) query = query.or(nameSearchFilter(search, MEDICINE_SEARCH_COLUMNS));

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? [])
    .filter(
      (row) =>
        Number(row.total_quantity_base_units ?? 0) <= Number(row.min_reorder_level ?? 0)
    )
    .map((row) => row.id);
};

/** Resolves distinct medicines that have an in-stock batch nearing expiry. */
const findExpiringMedicineIds = async (
  branchId: string,
  expiringDays: number
): Promise<string[]> => {
  const now = new Date().toISOString();
  const until = new Date(Date.now() + expiringDays * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from('item_batches')
    .select('medicine_id')
    .eq('is_deleted', false)
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .gt('expiry_date', now)
    .lt('expiry_date', until)
    .or('unit1_quantity.gt.0,unit2_quantity.gt.0,unit3_quantity.gt.0');

  throwIfError(error);
  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.medicine_id)
        .filter((id): id is string => Boolean(id))
    )
  );
};

/** Paginates an in-memory id list by fetching only the visible page of rows. */
const pageByMedicineIds = async (
  ids: string[],
  page: number,
  pageSize: number
): Promise<MedicineListResult> => {
  if (ids.length === 0) return { items: [], total: 0, page, pageSize };

  const start = (page - 1) * pageSize;
  const pageIds = ids.slice(start, start + pageSize);
  if (pageIds.length === 0) return { items: [], total: ids.length, page, pageSize };

  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .in('id', pageIds)
    .order('name', { ascending: true });

  throwIfError(error);
  return { items: data ?? [], total: ids.length, page, pageSize };
};

export const MedicinesRepository = {
  async list(params: MedicineListParams = {}): Promise<MedicineListResult> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('medicines')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);

    if (!params.includeDeleted) query = query.eq('is_deleted', false);
    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.categoryId) query = query.eq('category_id', params.categoryId);
    if (params.brandId) query = query.eq('brand_id', params.brandId);
    if (params.therapeuticGroupId) query = query.eq('therapeutic_group_id', params.therapeuticGroupId);
    if (params.productTypeId) query = query.eq('product_type_id', params.productTypeId);

    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, ['name', 'name_ar', 'name_en', 'generic_name', 'barcode']));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  /**
   * Branch-scoped listing with search and quick stock/expiry filters.
   *
   * Implemented with read-only PostgREST queries only. The database functions
   * `get_filtered_medicines` / `count_filtered_medicines` cannot be used because
   * they reference a non-existent `item_batches.quantity_in_base_units` column.
   */
  async listFiltered(params: MedicineFilteredParams): Promise<MedicineListResult> {
    const { branchId, filter = 'all', search, page = 1, pageSize = DEFAULT_PAGE_SIZE, expiringDays = 90 } = params;
    const { from, to } = pageToRange({ page, pageSize });

    if (filter === 'low_stock') {
      const ids = await findLowStockIds(branchId, search);
      return pageByMedicineIds(ids, page, pageSize);
    }

    if (filter === 'expiring_soon') {
      const ids = await findExpiringMedicineIds(branchId, expiringDays);
      if (ids.length === 0) return { items: [], total: 0, page, pageSize };

      let expiryQuery = supabase
        .from('medicines')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)
        .in('id', ids);
      if (search?.trim()) expiryQuery = expiryQuery.or(nameSearchFilter(search, MEDICINE_SEARCH_COLUMNS));

      const { data, error, count } = await expiryQuery.order('name', { ascending: true }).range(from, to);
      throwIfError(error);
      return { items: data ?? [], total: count ?? 0, page, pageSize };
    }

    let query = supabase
      .from('medicines')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('branch_id', branchId);

    if (filter === 'out_of_stock') {
      query = query.or('total_quantity_base_units.lte.0,total_quantity_base_units.is.null');
    }
    if (search?.trim()) query = query.or(nameSearchFilter(search, MEDICINE_SEARCH_COLUMNS));

    const { data, error, count } = await query.order('name', { ascending: true }).range(from, to);
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  /** Counts active medicines whose stock reached their reorder level. */
  async countLowStock(branchId: string): Promise<number> {
    const ids = await findLowStockIds(branchId, undefined, true);
    return ids.length;
  },

  async getById(id: string): Promise<Medicine | null> {
    const { data, error } = await supabase.from('medicines').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data;
  },

  async findByBarcode(barcode: string, branchId?: string | null): Promise<Medicine | null> {
    let query = supabase
      .from('medicines')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_deleted', false)
      .limit(1);
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query.maybeSingle();
    throwIfError(error);
    return data;
  },

  async listUnitLevels(medicineId: string): Promise<MedicineUnitLevel[]> {
    const { data, error } = await supabase
      .from('medicine_unit_levels')
      .select('*')
      .eq('medicine_id', medicineId)
      .eq('is_deleted', false)
      .order('unit_level', { ascending: true });
    throwIfError(error);
    return data ?? [];
  },

  async create(input: MedicineInsert): Promise<Medicine> {
    const { data, error } = await supabase.from('medicines').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء الدواء.');
    return data;
  },

  async update(id: string, patch: MedicineUpdate): Promise<Medicine> {
    const { data, error } = await supabase
      .from('medicines')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم العثور على الدواء.');
    return data;
  },

  async softDelete(id: string, userId: string, userName: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('medicines')
      .update({ is_deleted: true, is_active: false, deleted_at: now, deleted_by: userId, deleted_by_name: userName, last_modified: now })
      .eq('id', id);
    throwIfError(error);
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('medicines')
      .update({ is_deleted: false, deleted_at: null, deleted_by: null, last_modified: new Date().toISOString() })
      .eq('id', id);
    throwIfError(error);
  },

  async seedStock(medicineId: string): Promise<number> {
    const { data, error } = await supabase.rpc('recalculate_medicine_stock', { p_medicine_id: medicineId });
    throwIfError(error);
    return data ?? 0;
  },

  async countFiltered(params: {
    branchId: string;
    search?: string;
    filter?: string;
    expiringDays?: number;
  }): Promise<number> {
    const result = await this.listFiltered({
      branchId: params.branchId,
      filter: (params.filter as MedicineQuickFilter | undefined) ?? 'all',
      search: params.search,
      expiringDays: params.expiringDays,
      page: 1,
      pageSize: 1,
    });
    return result.total;
  },
};
