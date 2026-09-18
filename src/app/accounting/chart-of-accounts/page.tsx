'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationRtl } from '@/components/PaginationRtl';
import { AccountingRepository, ACCOUNT_TYPE_LABELS, type AccountType } from '@/core/pharmacy/accounting_repository';
import { piastersToEgp, type ChartOfAccount } from '@/types/pharmacy';

const PAGE_SIZE = 50;
const EMPTY_VALUE = '__all__';

const typeColors: Record<string, string> = {
  asset: 'text-sky-600 dark:text-sky-400',
  liability: 'text-amber-600 dark:text-amber-400',
  equity: 'text-violet-600 dark:text-violet-400',
  revenue: 'text-emerald-600 dark:text-emerald-400',
  expense: 'text-rose-600 dark:text-rose-400',
};

export default function ChartOfAccountsPage() {
  const [items, setItems] = useState<ChartOfAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [accountType, setAccountType] = useState<string>(EMPTY_VALUE);
  const [summary, setSummary] = useState<Record<AccountType, number> | null>(null);
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
      const [result, balances] = await Promise.all([
        AccountingRepository.list({
          search: debouncedSearch,
          accountType: accountType === EMPTY_VALUE ? 'all' : (accountType as AccountType),
          page,
          pageSize: PAGE_SIZE,
        }),
        AccountingRepository.balancesByType(),
      ]);
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
      setSummary(balances);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'تعذّر تحميل دليل الحسابات.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [debouncedSearch, accountType, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const totalBalance = useMemo(
    () => items.reduce((acc, a) => acc + Number(a.balance_piasters ?? 0), 0),
    [items]
  );

  return (
    <AppShell
      title="دليل الحسابات"
      subtitle={`${total.toLocaleString('ar-EG')} حساب — رصيد الصفحة ${piastersToEgp(totalBalance).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summary &&
          (Object.entries(summary) as [AccountType, number][]).map(([type, value]) => (
            <Card key={type} className="border-slate-200/80 dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="text-[10px] font-bold text-slate-400 mb-1">{ACCOUNT_TYPE_LABELS[type]}</div>
                <div className={`text-base font-black ${typeColors[type]}`}>
                  {value.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
              className="pr-10 h-11 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
            />
          </div>
          <Select value={accountType} onValueChange={(v) => { setAccountType(v); setPage(1); }}>
            <SelectTrigger className="h-11 rounded-xl sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>كل الأنواع</SelectItem>
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                <SelectItem key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</SelectItem>
              ))}
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
                <TableHead>الكود</TableHead>
                <TableHead>الحساب</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الرصيد</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 12 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 5 }).map((__, c) => (
                    <TableCell key={c}><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <BookOpen className="w-8 h-8" />
                      <span className="text-xs font-bold">لا توجد حسابات مطابقة.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs font-black text-slate-400" dir="ltr">{a.code}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-100">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[a.account_type ?? '']}>
                      {a.account_type ? ACCOUNT_TYPE_LABELS[a.account_type as AccountType] : '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-black text-slate-800 dark:text-slate-100">
                    {piastersToEgp(a.balance_piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.is_active ? 'success' : 'secondary'}>{a.is_active ? 'نشط' : 'موقوف'}</Badge>
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