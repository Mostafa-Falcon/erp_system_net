'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { SalesRepository } from '@/core/pharmacy/sales_repository';
import { piastersToEgp, type CashierShift } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  closed: 'مغلقة',
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  open: 'success',
  closed: 'outline',
};

const columns: DataColumn<CashierShift>[] = [
  {
    key: 'shift',
    header: 'الوردية',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">وردية رقم {(row.shift_number ?? 0).toLocaleString('ar-EG')}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.cashier_name || 'كاشير'}</p>
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
  { key: 'open', header: 'الافتتاح', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.opened_at)}</span> },
  { key: 'close', header: 'الإغلاق', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.closed_at)}</span> },
  { key: 'opening', header: 'رصيد الافتتاح', render: (row) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmt(row.opening_cash_piasters)}</span> },
  { key: 'diff', header: 'الفرق', render: (row) => <span className="text-xs font-black text-rose-600 dark:text-rose-400">{fmt(row.difference_piasters)}</span> },
];

export default function ShiftsPage() {
  return (
    <PagedTablePage<CashierShift>
      title="ورديات الكاشير"
      subtitle="فتح وإغلاق ورديات الصندوق"
      searchPlaceholder="ابحث باسم الكاشير أو الخزينة..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        SalesRepository.listShifts({ branchId, search, page, pageSize })
      }
    />
  );
}