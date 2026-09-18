'use client';

import React from 'react';
import { Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { HrRepository } from '@/core/pharmacy/hr_repository';
import type { EmployeeAttendance } from '@/types/pharmacy';

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const STATUS_LABELS: Record<string, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  on_leave: 'إجازة',
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  present: 'success',
  late: 'warning',
  absent: 'destructive',
  on_leave: 'outline',
};

const columns: DataColumn<EmployeeAttendance>[] = [
  {
    key: 'user',
    header: 'الموظف',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400 flex items-center justify-center shrink-0">
          <Clock3 className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.user_id.slice(0, 8)}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.notes || '-'}</p>
        </div>
      </div>
    ),
  },
  { key: 'check_in', header: 'الحضور', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.check_in_time)}</span> },
  { key: 'check_out', header: 'الانصراف', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.check_out_time)}</span> },
  {
    key: 'late',
    header: 'التأخير',
    render: (row) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{row.late_minutes ? `${row.late_minutes} د` : '-'}</span>,
  },
  {
    key: 'overtime',
    header: 'الإضافي',
    render: (row) => <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.overtime_minutes ? `${row.overtime_minutes} د` : '-'}</span>,
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) => (
      <Badge variant={STATUS_VARIANT[row.status ?? ''] ?? 'outline'}>{STATUS_LABELS[row.status ?? ''] ?? row.status ?? '-'}</Badge>
    ),
  },
];

export default function AttendancePage() {
  return (
    <PagedTablePage<EmployeeAttendance>
      title="الحضور والانصراف"
      subtitle="تسجيل حضور الموظفين"
      searchPlaceholder="ابحث بالاسم أو الملاحظات..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        HrRepository.listAttendance({ branchId, search, page, pageSize })
      }
    />
  );
}