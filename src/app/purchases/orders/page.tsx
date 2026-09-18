'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { PurchasesRepository } from '@/core/pharmacy/purchases_repository';
import { PURCHASE_STATUS_LABELS, piastersToEgp, type PurchaseOrder } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('ar-EG') : '-';

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  received: 'success',
  partial: 'warning',
  ordered: 'default',
  draft: 'outline',
  cancelled: 'destructive',
};

const columns: DataColumn<PurchaseOrder>[] = [
  {
    key: 'order',
    header: 'الطلب',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <ListChecks className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.order_number || row.id.slice(0, 8)}</p>
          <p className="text-[10px] font-semibold text-slate-400">{row.supplier_name}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) => (
      <Badge variant={STATUS_VARIANT[row.status] ?? 'outline'}>
        {PURCHASE_STATUS_LABELS[row.status] ?? row.status}
      </Badge>
    ),
  },
  {
    key: 'total',
    header: 'الإجمالي',
    render: (row) => <span className="text-xs font-black text-blue-600 dark:text-blue-400">{fmt(row.total_amount_piasters)}</span>,
  },
  { key: 'expected', header: 'التسليم المتوقع', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.expected_delivery_date)}</span> },
  { key: 'notes', header: 'ملاحظات', render: (row) => <span className="text-xs font-semibold text-slate-400 truncate max-w-48">{row.notes || '-'}</span> },
];

export default function PurchaseOrdersPage() {
  return (
    <PagedTablePage<PurchaseOrder>
      title="أوامر الشراء"
      subtitle="طلبات التوريد من الموردين"
      searchPlaceholder="ابحث برقم الطلب أو المورد..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        PurchasesRepository.listOrders({ branchId, search, page, pageSize })
      }
    />
  );
}