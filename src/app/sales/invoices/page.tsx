'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Receipt } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationRtl } from '@/components/PaginationRtl';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/core/pharmacy/sales_repository';
import { piastersToEgp, type SaleInvoice } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const EMPTY_VALUE = '__all__';

const paymentMethodLabels: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  credit: 'آجل',
  mixed: 'مختلط',
};

const paymentStatusLabels: Record<string, string> = {
  paid: 'مدفوعة',
  partial: 'جزئي',
  credit: 'آجل',
  unpaid: 'غير مدفوعة',
};

const statusLabels: Record<string, string> = {
  completed: 'مكتملة',
  pending: 'معلقة',
  cancelled: 'ملغاة',
  returned: 'مرتجعة',
};

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function SalesInvoicesPage() {
  const { activeBranchId } = useSessionStore();
  const [items, setItems] = useState<SaleInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(EMPTY_VALUE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await SalesRepository.listInvoices({
        branchId: activeBranchId,
        search: debouncedSearch,
        paymentStatus: paymentStatus === EMPTY_VALUE ? null : paymentStatus,
        page,
        pageSize: PAGE_SIZE,
      });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الفواتير.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [activeBranchId, debouncedSearch, paymentStatus, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('falcon_data_changed', load);
    return () => window.removeEventListener('falcon_data_changed', load);
  }, [load]);

  return (
    <AppShell
      title="فواتير البيع"
      subtitle={`إجمالي ${total.toLocaleString('ar-EG')} فاتورة`}
    >
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="رقم الفاتورة أو اسم العميل..."
              className="pr-10 h-11 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
            />
          </div>
          <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}>
            <SelectTrigger className="h-11 rounded-xl sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>كل حالات الدفع</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="partial">جزئي</SelectItem>
              <SelectItem value="credit">آجل</SelectItem>
              <SelectItem value="unpaid">غير مدفوعة</SelectItem>
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
                <TableHead>الرقم</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الكاشير</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 9 }).map((__, c) => (
                    <TableCell key={c}><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Receipt className="w-8 h-8" />
                      <span className="text-xs font-bold">لا توجد فواتير مطابقة.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && items.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-xs font-black text-emerald-600 dark:text-emerald-400">{inv.invoice_number}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-100">{inv.customer_name || 'عميل نقدي'}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500">{inv.cashier_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{paymentMethodLabels[inv.payment_method ?? ''] ?? inv.payment_method ?? '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-black text-slate-800 dark:text-slate-100">{fmt(inv.total_amount_piasters)}</TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmt(inv.paid_amount_piasters)}</TableCell>
                  <TableCell className={cn('text-xs font-black', Number(inv.remaining_amount_piasters ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')}>
                    {fmt(inv.remaining_amount_piasters)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      inv.payment_status === 'paid' ? 'success' :
                      inv.payment_status === 'partial' ? 'warning' : 'secondary'
                    }>
                      {paymentStatusLabels[inv.payment_status ?? ''] ?? inv.payment_status ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] font-semibold text-slate-400">
                    {fmtDate(inv.created_at)}
                    <span className="block text-[10px]">{statusLabels[inv.status ?? ''] ?? inv.status ?? ''}</span>
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