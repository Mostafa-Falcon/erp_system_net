'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationRtlProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

/** Right-to-left pagination bar used by all list screens. */
export const PaginationRtl: React.FC<PaginationRtlProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  onPageChange,
}) => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
      <span className="text-[11px] font-bold text-slate-400">
        {total.toLocaleString('ar-EG')} سجل — عرض {from.toLocaleString('ar-EG')} إلى {to.toLocaleString('ar-EG')}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="gap-1 rounded-lg"
        >
          <ChevronRight className="w-4 h-4" /> السابق
        </Button>
        <span className="text-[11px] font-bold text-slate-500 min-w-16 text-center">
          صفحة {page} من {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="gap-1 rounded-lg"
        >
          التالي <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};