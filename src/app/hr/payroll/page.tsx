'use client';

import React from 'react';
import { Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { HrRepository } from '@/core/pharmacy/hr_repository';
import { piastersToEgp, type EmployeePayroll } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('ar-EG') : '-';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  paid: 'مدفوع',
  partial: 'مسدد جزئياً',
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  paid: 'success',
  partial: 'warning',
  pending: 'outline',
};

const columns: DataColumn<EmployeePayroll>[] = [
  {
    key: 'user',
    header: 'الموظف',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
          <Banknote className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.user_id.slice(0, 8)}</p>
          <p className="text-[10px] font-semibold text-slate-400">{row.payroll_period || '-'}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) => (
      <Badge variant={STATUS_VARIANT[row.status ?? ''] ?? 'outline'}>{STATUS_LABELS[row.status ?? ''] ?? row.status ?? '-'}</Badge>
    ),
  },
  { key: 'base', header: 'الأساسي', render: (row) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmt(row.base_salary_piasters)}</span> },
  { key: 'net', header: 'الصافي', render: (row) => <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{fmt(row.net_salary_piasters)}</span> },
  { key: 'deductions', header: 'الخصومات', render: (row) => <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{fmt(row.deductions_piasters)}</span> },
  { key: 'date', header: 'الصرف', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.paid_at)}</span> },
];

export default function PayrollPage() {
  return (
    <PagedTablePage<EmployeePayroll>
      title="رواتب الموظفين"
      subtitle="أجور ورواتب الدورات المالية"
      searchPlaceholder="بالمدة أو الاسم..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        HrRepository.listPayrolls({ branchId, search, page, pageSize })
      }
    />
  );
}