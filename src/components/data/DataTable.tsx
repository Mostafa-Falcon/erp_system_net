'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyText?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalLabel?: string;
  footerExtra?: React.ReactNode;
}

/**
 * Generic table with loading skeletons, empty state and pagination footer.
 * Used across all read-only list screens.
 */
export const DataTable = <T,>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  skeletonRows = 8,
  emptyText = 'لا توجد بيانات مطابقة.',
  page,
  totalPages,
  onPageChange,
  totalLabel,
  footerExtra,
}: DataTableProps<T>) => (
  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={cn('whitespace-nowrap', col.className)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}

          {!isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Inbox className="w-8 h-8" />
                  <span className="text-xs font-bold">{emptyText}</span>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            rows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn('whitespace-nowrap', col.className)}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '') || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>

    {(onPageChange || footerExtra) && (
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-bold text-slate-400">{totalLabel}</span>
        <div className="flex items-center gap-2">
          {footerExtra}
          {onPageChange && totalPages !== undefined && (
            <>
              <span className="text-[11px] font-bold text-slate-400">
                صفحة {page} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!page || page <= 1 || isLoading}
                  onClick={() => onPageChange(Math.max(1, (page ?? 1) - 1))}
                  className="gap-1 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" /> السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!page || (totalPages !== undefined && page >= totalPages) || isLoading}
                  onClick={() => onPageChange((page ?? 1) + 1)}
                  className="gap-1 rounded-lg"
                >
                  التالي <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);

export default DataTable;