'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Package, AlertTriangle, PackageCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationRtl } from '@/components/PaginationRtl';
import { useSessionStore } from '@/core/state/useSessionStore';
import { InventoryRepository, type BatchExpiryFilter, type BatchWithName } from '@/core/pharmacy/inventory_repository';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;
const EMPTY_VALUE = '__all__';

const fmtDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const daysLeft = (iso: string | null): number | null => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
};

export default function BatchesPage() {
  const { activeBranchId } = useSessionStore();
  const [items, setItems] = useState<BatchWithName[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<BatchExpiryFilter | typeof EMPTY_VALUE>(EMPTY_VALUE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiringCount, setExpiringCount] = useState<number | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!activeBranchId) return;
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const [result, expiring] = await Promise.all([
        InventoryRepository.listBatches({
          branchId: activeBranchId,
          search: debouncedSearch,
          expiryFilter: expiryFilter === EMPTY_VALUE ? 'all' : expiryFilter,
          page,
          pageSize: PAGE_SIZE,
        }),
        InventoryRepository.countExpiring(activeBranchId, 90),
      ]);
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
      setExpiringCount(expiring);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الباتشات.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [activeBranchId, debouncedSearch, expiryFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('falcon_data_changed', load);
    return () => window.removeEventListener('falcon_data_changed', load);
  }, [load]);

  const renderExpiryBadge = (expiry: string | null) => {
    if (!expiry) return <Badge variant="secondary">بلا تاريخ انتهاء</Badge>;
    const left = daysLeft(expiry) ?? 0;
    if (left < 0) return <Badge variant="destructive">منتهي ({fmtDate(expiry)})</Badge>;
    if (left <= 90) return <Badge variant="warning">قارب ({fmtDate(expiry)})</Badge>;
    return <Badge variant="success">{fmtDate(expiry)}</Badge>;
  };

  return (
    <AppShell
      title="الباتشات (جرد المستودع)"
      subtitle={`إجمالي ${total.toLocaleString('ar-EG')} باتش`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-semibold text-slate-400">إجمالي الباتشات</div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{total.toLocaleString('ar-EG')}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-semibold text-slate-400">باتش قارب على الانتهاء (90 يوم)</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {expiringCount === null ? '...' : expiringCount.toLocaleString('ar-EG')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="رقم الباتش..."
              className="pr-10 h-11 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
            />
          </div>
          <Select value={expiryFilter} onValueChange={(v) => { setExpiryFilter(v as BatchExpiryFilter | typeof EMPTY_VALUE); setPage(1); }}>
            <SelectTrigger className="h-11 rounded-xl sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>كل الباتشات</SelectItem>
              <SelectItem value="expired">منتهية الصلاحية</SelectItem>
              <SelectItem value="expiring">قاربت على الانتهاء</SelectItem>
              <SelectItem value="ok">سارية الصلاحية</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>رقم الباتش</TableHead>
                <TableHead>الكمية (وحدة 1)</TableHead>
                <TableHead>الكمية (وحدة 2)</TableHead>
                <TableHead>الكمية (وحدة 3)</TableHead>
                <TableHead>مستوى الوحدة</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 8 }).map((__, c) => (
                    <TableCell key={c}><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <PackageCheck className="w-8 h-8" />
                      <span className="text-xs font-bold">لا توجد باتشات مطابقة.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-100">{b.medicine_name || b.medicine_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs font-black text-slate-400">{b.batch_number || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Number(b.unit1_quantity ?? 0).toLocaleString('ar-EG')}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Number(b.unit2_quantity ?? 0).toLocaleString('ar-EG')}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Number(b.unit3_quantity ?? 0).toLocaleString('ar-EG')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{b.unit_level ?? 1}</Badge>
                  </TableCell>
                  <TableCell>{renderExpiryBadge(b.expiry_date)}</TableCell>
                  <TableCell>
                    <Badge variant={b.is_active ? 'success' : 'secondary'} className={cn(!b.is_active && 'opacity-60')}>
                      {b.is_active ? 'متاح' : 'مغلق'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationRtl
            page={page}
            totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            total={total}
            pageSize={PAGE_SIZE}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}