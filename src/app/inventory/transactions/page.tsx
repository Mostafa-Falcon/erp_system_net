'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { InventoryRepository, TRANSACTION_TYPE_LABELS } from '@/core/pharmacy/inventory_repository';
import type { InventoryTransaction } from '@/types/pharmacy';

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  purchase: 'success',
  sale: 'default',
  sale_return: 'warning',
  purchase_return: 'destructive',
  transfer_in: 'success',
  transfer_out: 'warning',
  initial: 'outline',
  damaged: 'destructive',
};

const columns: DataColumn<InventoryTransaction>[] = [
  {
    key: 'medicine',
    header: 'الصنف',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.medicine_name}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.reference_number || row.batch_number || '-'}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'النوع',
    render: (row) => (
      <Badge variant={VARIANT[row.transaction_type] ?? 'outline'}>
        {TRANSACTION_TYPE_LABELS[row.transaction_type] ?? row.transaction_type}
      </Badge>
    ),
  },
  {
    key: 'change',
    header: 'الكمية',
    render: (row) => (
      <span className={`text-xs font-black ${(row.quantity_change ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {(row.quantity_change ?? 0) > 0 ? '+' : ''}{(row.quantity_change ?? 0).toLocaleString('ar-EG')}
      </span>
    ),
  },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-[11px] font-semibold text-slate-500">{fmtDate(row.created_at)}</span> },
  { key: 'creator', header: 'بواسطة', render: (row) => <span className="text-xs font-semibold text-slate-500">{row.created_by_name || row.created_by || '-'}</span> },
];

export default function TransactionsPage() {
  return (
    <PagedTablePage<InventoryTransaction>
      title="حركة المخزن"
      subtitle="سجل حركة الأصناف داخل وخارج المخزون"
      searchPlaceholder="ابحث بالصنف أو رقم المرجع..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        InventoryRepository.listTransactions({ branchId, search, page, pageSize })
      }
    />
  );
}