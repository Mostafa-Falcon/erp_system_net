'use client';

import React from 'react';
import { NotebookPen } from 'lucide-react';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { AccountingRepository } from '@/core/pharmacy/accounting_repository';
import type { JournalEntry } from '@/types/pharmacy';

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'short' }) : '-';

const columns: DataColumn<JournalEntry>[] = [
  {
    key: 'entry',
    header: 'القيد',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
          <NotebookPen className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.entry_number || row.id.slice(0, 8)}</p>
          {row.reference_id && <p className="text-[10px] font-semibold text-slate-400">مرجع: {row.reference_id}</p>}
        </div>
      </div>
    ),
  },
  { key: 'date', header: 'التاريخ', render: (row) => <span className="text-xs font-semibold text-slate-500">{fmtDate(row.entry_date)}</span> },
  { key: 'description', header: 'البيان', render: (row) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-64">{row.description || '-'}</span> },
  { key: 'creator', header: 'بواسطة', render: (row) => <span className="text-xs font-semibold text-slate-500">{row.created_by_name || '-'}</span> },
];

export default function JournalPage() {
  return (
    <PagedTablePage<JournalEntry>
      title="قيود اليومية"
      subtitle="الحركة المالية المسجلة"
      searchPlaceholder="ابحث برقم القيد أو البيان..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        AccountingRepository.listJournalEntries({ branchId, search, page, pageSize })
      }
    />
  );
}