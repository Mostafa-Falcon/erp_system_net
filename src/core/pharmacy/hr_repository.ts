/**
 * HR data access (employees, attendance, leaves, advances, payrolls).
 */

import { supabase } from '@/core/supabase/supabase_client';
import { DEFAULT_PAGE_SIZE, nameSearchFilter, pageToRange, throwIfError, type PageParams } from './helpers';
import type {
  EmployeeAdvance,
  EmployeeAttendance,
  EmployeeLeave,
  EmployeePayroll,
  PharmacyUser,
} from '@/types/pharmacy';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HrListParams extends PageParams {
  branchId?: string | null;
  search?: string;
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'إجازة سنوية',
  sick: 'إجازة مرضية',
  emergency: 'طارئة',
  unpaid: 'بدون راتب',
  other: 'أخرى',
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
};

export const HrRepository = {
  async listEmployees(params: HrListParams): Promise<PagedResult<PharmacyUser>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);

    if (params.branchId) query = query.eq('assigned_branch_id', params.branchId);
    if (params.search?.trim()) query = query.or(nameSearchFilter(params.search, ['name', 'email']));

    const { data, error, count } = await query;
    throwIfError(error, 'تعذّر تحميل الموظفين.');
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listAttendance(params: HrListParams): Promise<PagedResult<EmployeeAttendance>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('employee_attendance')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('check_in_time', { ascending: false })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.search?.trim()) query = query.or(nameSearchFilter(params.search, ['user_id', 'notes']));

    const { data, error, count } = await query;
    throwIfError(error, 'تعذّر تحميل الحضور والانصراف.');
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listLeaves(params: HrListParams): Promise<PagedResult<EmployeeLeave>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('employee_leaves')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('start_date', { ascending: false })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.search?.trim()) query = query.or(nameSearchFilter(params.search, ['user_id', 'reason']));

    const { data, error, count } = await query;
    throwIfError(error, 'تعذّر تحميل الإجازات.');
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listAdvances(params: HrListParams): Promise<PagedResult<EmployeeAdvance>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('employee_advances')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('issue_date', { ascending: false })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.search?.trim()) query = query.or(nameSearchFilter(params.search, ['user_id', 'reason']));

    const { data, error, count } = await query;
    throwIfError(error, 'تعذّر تحميل السلف.');
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listPayrolls(params: HrListParams): Promise<PagedResult<EmployeePayroll>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const { from, to } = pageToRange({ page, pageSize });

    let query = supabase
      .from('employee_payrolls')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.search?.trim()) query = query.or(nameSearchFilter(params.search, ['user_id', 'payroll_period']));

    const { data, error, count } = await query;
    throwIfError(error, 'تعذّر تحميل الرواتب.');
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  },

  async listEmployeeUsers(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase.from('users').select('id, name').order('name', { ascending: true });
    throwIfError(error);
    return (data ?? []).filter((u): u is { id: string; name: string } => Boolean(u.name));
  },
};