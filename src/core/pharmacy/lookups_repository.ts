/**
 * Reference / lookup data access (categories, brands, units, groups, ...).
 * All lookups are account-scoped by RLS and optionally branch-scoped.
 */

import { supabase } from '@/core/supabase/supabase_client';
import { throwIfError } from './helpers';
import type {
  Branch,
  Doctor,
  MedicineBrand,
  MedicineCategory,
  MedicineUnit,
  ProductType,
  TherapeuticGroup,
  Treasury,
} from '@/types/pharmacy';

export const LookupsRepository = {
  async branches(): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('is_main_branch', { ascending: false });
    throwIfError(error);
    return data ?? [];
  },

  async categories(): Promise<MedicineCategory[]> {
    const { data, error } = await supabase
      .from('medicine_categories')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    throwIfError(error);
    return data ?? [];
  },

  async brands(): Promise<MedicineBrand[]> {
    const { data, error } = await supabase
      .from('medicine_brands')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    throwIfError(error);
    return data ?? [];
  },

  async therapeuticGroups(): Promise<TherapeuticGroup[]> {
    const { data, error } = await supabase
      .from('therapeutic_groups')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    throwIfError(error);
    return data ?? [];
  },

  async productTypes(): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    throwIfError(error);
    return data ?? [];
  },

  async units(): Promise<MedicineUnit[]> {
    const { data, error } = await supabase
      .from('medicine_units')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    throwIfError(error);
    return data ?? [];
  },

  async doctors(branchId?: string | null): Promise<Doctor[]> {
    let query = supabase.from('doctors').select('*').eq('is_deleted', false).order('name');
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  },

  async treasuries(branchId?: string | null): Promise<Treasury[]> {
    let query = supabase.from('treasuries').select('*').eq('is_deleted', false).order('is_main', { ascending: false });
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  },
};
