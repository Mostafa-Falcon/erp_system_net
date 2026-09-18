'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { InventoryRepository } from '@/core/pharmacy/inventory_repository';
import { piastersToEgp, type DamagedStockLog } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('ar-EG') : '-';

const columns: DataColumn<DamagedStockLog>[] = [
  {
    key: 'medicine',
    header: 'الصنف',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <Trash2 className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.medicine_name}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.batch_number || '-'}</p>
        </div>
      </div>
    ),
  },
  { key: 'qty', header: 'الكمية', render: (row) => <span className="text-xs font-black text-rose-600 dark:text-rose-400">{(row.quantity ?? 0).toLocaleString('ar-EG')}</span> },
  { key: 'cost', header: 'التكلفة', render: (row) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmt(row.total_cost_piasters)}</span> },
  { key: 'reason', header: 'السبب', render: (row) => <span className="text-xs font-semibold text-slate-500">{row.reason || '-'}</span> },
  { key: 'notes', header: 'ملاحظات', render: (row) => <span className="text-xs font-semibold text-slate-400 truncate max-w-48">{row.notes || '-'}</span> },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.created_at)}</span> },
];

export default function DamagesPage() {
  return (
    <PagedTablePage<DamagedStockLog>
      title="التوالف"
      subtitle="سجل الأصناف التالفة أو المنتهية"
      searchPlaceholder="ابحث بالصنف أو السبب..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        InventoryRepository.listDamaged({ branchId, search, page, pageSize })
      }
    />
  );
}