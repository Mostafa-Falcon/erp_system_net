'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { InventoryRepository } from '@/core/pharmacy/inventory_repository';
import { piastersToEgp, type InventoryAudit } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short' }) : '-';

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'قيد الجرد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
};

const columns: DataColumn<InventoryAudit>[] = [
  {
    key: 'audit',
    header: 'الجرد',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.audit_number || row.id.slice(0, 8)}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{row.created_by_name || '-'}</p>
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
  { key: 'variance', header: 'قيمة الفروقات', render: (row) => <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{fmt(row.total_variance_piasters)}</span> },
  { key: 'notes', header: 'ملاحظات', render: (row) => <span className="text-xs font-semibold text-slate-400 truncate max-w-48">{row.notes || '-'}</span> },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.created_at)}</span> },
];

export default function AuditsPage() {
  return (
    <PagedTablePage<InventoryAudit>
      title="جرد المخزون"
      subtitle="حركات الجرد الدوري والجرد المستمر"
      searchPlaceholder="ابحث برقم الجرد أو الملاحظات..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        InventoryRepository.listAudits({ branchId, search, page, pageSize })
      }
    />
  );
}