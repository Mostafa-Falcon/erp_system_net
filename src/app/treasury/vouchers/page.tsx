'use client';

import React from 'react';
import { ArrowUpRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { TreasuryRepository } from '@/core/pharmacy/treasury_repository';
import { piastersToEgp, type PaymentVoucher } from '@/types/pharmacy';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short' }) : '-';

const VOUCHER_TYPE_LABELS: Record<string, string> = {
  receipt: 'سند قبض',
  payment: 'سند دفع',
};

const columns: DataColumn<PaymentVoucher>[] = [
  {
    key: 'voucher',
    header: 'السند',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.voucher_number || row.id.slice(0, 8)}</p>
          {row.reference_number && <p className="text-[10px] font-semibold text-slate-400">مرجع: {row.reference_number}</p>}
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'النوع',
    render: (row) => (
      <Badge variant={row.voucher_type === 'payment' ? 'destructive' : 'success'}>
        {VOUCHER_TYPE_LABELS[row.voucher_type] ?? row.voucher_type}
      </Badge>
    ),
  },
  { key: 'party', header: 'الطرف', render: (row) => <span className="text-xs font-semibold text-slate-500">{row.party_name || '-'}</span> },
  {
    key: 'amount',
    header: 'المبلغ',
    render: (row) => (
      <span className="inline-flex items-center gap-1 text-xs font-black">
        <ArrowUpRight className={row.voucher_type === 'payment' ? 'w-3.5 h-3.5 text-rose-500 rotate-90' : 'w-3.5 h-3.5 text-emerald-500'} />
        <span className={row.voucher_type === 'payment' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
          {fmt(row.amount_piasters)}
        </span>
      </span>
    ),
  },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.voucher_date)}</span> },
];

export default function VouchersPage() {
  return (
    <PagedTablePage<PaymentVoucher>
      title="سندات القبض والدفع"
      subtitle="السندات المالية المسجلة بالفرع"
      searchPlaceholder="ابحث برقم السند أو الطرف..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        TreasuryRepository.listVouchers({ branchId, search, page, pageSize })
      }
    />
  );
}