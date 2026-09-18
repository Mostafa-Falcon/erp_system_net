'use client';

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { InventoryRepository } from '@/core/pharmacy/inventory_repository';
import type { StockTransfer } from '@/types/pharmacy';

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short' }) : '-';

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  shipped: 'warning',
  received: 'success',
  in_transit: 'default',
  cancelled: 'destructive',
  draft: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  shipped: 'تم الشحن',
  received: 'تم الاستلام',
  in_transit: 'قيد النقل',
  cancelled: 'ملغي',
};

const columns: DataColumn<StockTransfer>[] = [
  {
    key: 'transfer',
    header: 'التحويل',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <ArrowLeftRight className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.transfer_number || row.id.slice(0, 8)}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.from_branch_id.slice(0, 8)} ← {row.to_branch_id.slice(0, 8)}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) => (
      <Badge variant={STATUS_VARIANT[row.status] ?? 'outline'}>{STATUS_LABELS[row.status] ?? row.status}</Badge>
    ),
  },
  { key: 'shipped', header: 'تاريخ الشحن', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.shipped_at)}</span> },
  { key: 'received', header: 'تاريخ الاستلام', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.received_at)}</span> },
  { key: 'notes', header: 'ملاحظات', render: (row) => <span className="text-xs font-semibold text-slate-400 truncate max-w-48">{row.notes || '-'}</span> },
];

export default function TransfersPage() {
  return (
    <PagedTablePage<StockTransfer>
      title="التحويلات بين الفروع"
      subtitle="نقل الأصناف بين فروع الجهة"
      searchPlaceholder="ابحث برقم التحويل أو الملاحظات..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        InventoryRepository.listTransfers({ branchId, search, page, pageSize })
      }
    />
  );
}