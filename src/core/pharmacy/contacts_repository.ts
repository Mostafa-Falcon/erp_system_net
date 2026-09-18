/**
 * Customers / suppliers / doctors data access.
 *
 * Tenancy is resolved by RLS; callers only supply the branch scope and entity
 * search/filter parameters. Writes go through PostgREST and are validated by
 * the database policies -- no DB function dependencies.
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
  Customer,
  Doctor,
  Supplier,
  TablesInsert,
  TablesUpdate,
} from '@/types/pharmacy';

export interface ContactListParams extends PageParams {
  branchId?: string | null;
  search?: string;
  activeOnly?: boolean;
}

export interface ContactListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const CUSTOMER_SEARCH_COLUMNS = ['name', 'phone', 'email', 'code'];
const SUPPLIER_SEARCH_COLUMNS = ['name', 'phone', 'email', 'code'];
const DOCTOR_SEARCH_COLUMNS = ['name', 'specialty', 'phone'];

export const ContactsRepository = {
  async customers(params: ContactListParams = {}): Promise<ContactListResult<Customer>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.activeOnly) query = query.eq('is_active', true);
    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, CUSTOMER_SEARCH_COLUMNS));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listCustomers(params: ContactListParams = {}): Promise<ContactListResult<Customer>> {
    return this.customers(params);
  },

  async createCustomer(input: TablesInsert<'customers'>): Promise<Customer> {
    const { data, error } = await supabase.from('customers').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء العميل.');
    return data;
  },

  async updateCustomer(id: string, patch: TablesUpdate<'customers'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم العثور على العميل.');
    return data;
  },

  async suppliers(params: ContactListParams = {}): Promise<ContactListResult<Supplier>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.activeOnly) query = query.eq('is_active', true);
    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, SUPPLIER_SEARCH_COLUMNS));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async createSupplier(input: TablesInsert<'suppliers'>): Promise<Supplier> {
    const { data, error } = await supabase.from('suppliers').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء المورد.');
    return data;
  },

  async updateSupplier(id: string, patch: TablesUpdate<'suppliers'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم العثور على المورد.');
    return data;
  },

  async doctors(params: ContactListParams = {}): Promise<ContactListResult<Doctor>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('doctors')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.activeOnly) query = query.eq('is_active', true);
    if (params.search?.trim()) {
      query = query.or(nameSearchFilter(params.search, DOCTOR_SEARCH_COLUMNS));
    }

    const { data, error, count } = await query;
    throwIfError(error);
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async createDoctor(input: TablesInsert<'doctors'>): Promise<Doctor> {
    const { data, error } = await supabase.from('doctors').insert(input).select('*').single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم إنشاء الطبيب.');
    return data;
  },

  async updateDoctor(id: string, patch: TablesUpdate<'doctors'>): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({ ...patch, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('لم يتم العثور على الطبيب.');
    return data;
  },
};