'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data/DataTable';
import { useSessionStore } from '@/core/state/useSessionStore';
import { LookupsRepository } from '@/core/pharmacy/lookups_repository';
import { DEFAULT_PAGE_SIZE } from '@/core/pharmacy/helpers';
import { cn } from '@/lib/utils';

export interface ListFetchParams {
  branchId: string;
  search: string;
  page: number;
  pageSize: number;
}

export interface ListFetchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface PagedTablePageProps<T> {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  pageSize?: number;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  fetcher: (params: ListFetchParams) => Promise<ListFetchResult<T>>;
}

/**
 * Shared branch-scoped, searchable, paginated list screen built on top of
 * {@link AppShell} + {@link DataTable}. Individual screens only supply a
 * fetcher and a column list.
 */
export const PagedTablePage = <T,>({
  title,
  subtitle,
  searchPlaceholder = 'ابحث...',
  emptyText = 'لا توجد بيانات مطابقة.',
  pageSize = DEFAULT_PAGE_SIZE,
  actions,
  filters,
  columns,
  getRowId,
  fetcher,
}: PagedTablePageProps<T>) => {
  const { activeBranchId } = useSessionStore();
  const [branchId, setBranchId] = useState<string | null>(activeBranchId);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (activeBranchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchId(activeBranchId);
      return;
    }
    if (branchId) return;
    LookupsRepository.branches()
      .then((rows) => setBranchId(rows[0]?.id ?? null))
      .catch(() => setBranchId(null));
  }, [activeBranchId, branchId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!branchId) {
      setIsLoading(false);
      return;
    }
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current({ branchId, search: debouncedSearch, page, pageSize });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'تعذّر تحميل البيانات.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [branchId, debouncedSearch, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('falcon_data_changed', load);
    return () => window.removeEventListener('falcon_data_changed', load);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell
      title={title}
      subtitle={subtitle ?? `إجمالي ${total.toLocaleString('ar-EG')} سجل`}
      actions={
        <>
          {actions}
          <Button variant="outline" onClick={load} className="gap-2 rounded-xl">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            تحديث
          </Button>
        </>
      }
    >
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pr-10 h-11 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
            />
          </div>
          {filters}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <DataTable<T>
        columns={columns}
        rows={items}
        getRowId={getRowId}
        isLoading={isLoading}
        emptyText={emptyText}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`إجمالي ${total.toLocaleString('ar-EG')} سجل`}
      />
    </AppShell>
  );
};

export default PagedTablePage;