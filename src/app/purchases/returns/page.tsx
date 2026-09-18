'use client';

import React from 'react';
import { Undo2 } from 'lucide-react';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { PurchasesRepository } from '@/core/pharmacy/purchases_repository';
import { piastersToEgp, type PurchaseReturn } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('ar-EG') : '-';

const columns: DataColumn<PurchaseReturn>[] = [
  {
    key: 'return',
    header: 'المرتجع',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
          <Undo2 className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.return_number || row.id.slice(0, 8)}</p>
          {row.original_purchase_id && <p className="text-[10px] font-semibold text-slate-400">فاتورة: {row.original_purchase_id}</p>}
        </div>
      </div>
    ),
  },
  { key: 'supplier', header: 'المورد', render: (row) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{row.supplier_name}</span> },
  {
    key: 'total',
    header: 'الإجمالي',
    render: (row) => <span className="text-xs font-black text-orange-600 dark:text-orange-400">{fmt(row.total_amount_piasters)}</span>,
  },
  { key: 'reason', header: 'السبب', render: (row) => <span className="text-xs font-semibold text-slate-400 truncate max-w-56">{row.reason_notes || '-'}</span> },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.created_at)}</span> },
];

export default function PurchaseReturnsPage() {
  return (
    <PagedTablePage<PurchaseReturn>
      title="مرتجعات الشراء"
      subtitle="فواتير مرتجعة للموردين"
      searchPlaceholder="ابحث برقم المرتجع أو المورد..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        PurchasesRepository.listReturns({ branchId, search, page, pageSize })
      }
    />
  );
}