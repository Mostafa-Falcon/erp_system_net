'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { InventoryRepository } from '@/core/pharmacy/inventory_repository';
import { piastersToEgp, type StockAdjustment } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const columns: DataColumn<StockAdjustment>[] = [
  {
    key: 'number',
    header: 'رقم التسوية',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.adjustment_number || row.id.slice(0, 8)}</p>
          {row.adjustment_type && <p className="text-[10px] font-semibold text-slate-400">{row.adjustment_type}</p>}
        </div>
      </div>
    ),
  },
  { key: 'amount', header: 'القيمة', render: (row) => <span className="text-xs font-black text-amber-600 dark:text-amber-400">{fmt(row.total_amount_piasters)}</span> },
  { key: 'recovered', header: 'المسترجَع', render: (row) => <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmt(row.recovered_amount_piasters)}</span> },
  { key: 'notes', header: 'ملاحظات', render: (row) => <span className="text-xs font-semibold text-slate-400 truncate max-w-48">{row.notes || '-'}</span> },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.created_at)}</span> },
];

export default function AdjustmentsPage() {
  return (
    <PagedTablePage<StockAdjustment>
      title="تسويات المخزون"
      subtitle="تسجيل فروقات جرد المخزون"
      searchPlaceholder="ابحث برقم التسوية أو الملاحظات..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        InventoryRepository.listAdjustments({ branchId, search, page, pageSize })
      }
    />
  );
}