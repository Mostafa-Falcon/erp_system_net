'use client';

import React from 'react';
import { CalendarOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { HrRepository, LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/core/pharmacy/hr_repository';
import type { EmployeeLeave } from '@/types/pharmacy';

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('ar-EG') : '-';

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'destructive',
};

const columns: DataColumn<EmployeeLeave>[] = [
  {
    key: 'user',
    header: 'الموظف',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
          <CalendarOff className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.user_id.slice(0, 8)}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.reason || '-'}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'النوع',
    render: (row) => <Badge variant="outline">{LEAVE_TYPE_LABELS[row.leave_type] ?? row.leave_type}</Badge>,
  },
  { key: 'period', header: 'الفترة', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.start_date)} ← {fmtDate(row.end_date)}</span> },
  { key: 'days', header: 'الأيام', render: (row) => <span className="text-xs font-black text-slate-700 dark:text-slate-200">{(row.total_days ?? 0).toLocaleString('ar-EG')}</span> },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) => (
      <Badge variant={STATUS_VARIANT[row.status ?? ''] ?? 'outline'}>{LEAVE_STATUS_LABELS[row.status ?? ''] ?? row.status ?? '-'}</Badge>
    ),
  },
];

export default function LeavesPage() {
  return (
    <PagedTablePage<EmployeeLeave>
      title="إجازات الموظفين"
      subtitle="طلبات الإجازات واعتمادها"
      searchPlaceholder="ابحث بالاسم أو السبب..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        HrRepository.listLeaves({ branchId, search, page, pageSize })
      }
    />
  );
}