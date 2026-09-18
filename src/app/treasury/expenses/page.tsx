'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PaginationRtl } from '@/components/PaginationRtl';
import { useSessionStore } from '@/core/state/useSessionStore';
import { TreasuryRepository } from '@/core/pharmacy/treasury_repository';
import { piastersToEgp, type Expense, type ExpenseCategory, type Treasury } from '@/types/pharmacy';
import { toast } from 'sonner';

const PAGE_SIZE = 25;
const EMPTY_VALUE = '__all__';

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function ExpensesPage() {
  const { session, activeBranchId } = useSessionStore();
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState(EMPTY_VALUE);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', categoryId: '', treasuryId: '' });

  useEffect(() => {
    let cancelled = false;
    if (!activeBranchId) return;
    TreasuryRepository.expenseCategories(activeBranchId)
      .then((cs) => { if (!cancelled) setCategories(cs); })
      .catch(() => {});
    TreasuryRepository.treasuries({ branchId: activeBranchId, pageSize: 100 })
      .then((tr) => { if (!cancelled) setTreasuries(tr.items); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeBranchId]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await TreasuryRepository.expenses({
        branchId: activeBranchId,
        categoryId: categoryFilter === EMPTY_VALUE ? null : categoryFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'طھط¹ط°ظ‘ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…طµط±ظˆظپط§طھ.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [activeBranchId, categoryFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('falcon_data_changed', load);
    return () => window.removeEventListener('falcon_data_changed', load);
  }, [load]);

  const totalAmount = useMemo(() => items.reduce((acc, e) => acc + Number(e.amount_piasters ?? 0), 0), [items]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!form.title.trim() || !form.amount) {
      toast.error('ط§ط³ظ… ط§ظ„ظ…طµط±ظˆظپ ظˆظ…ط¨ظ„ط؛ظ‡ ظ…ط·ظ„ظˆط¨ط§ظ†.');
      return;
    }
    const category = categories.find((c) => c.id === form.categoryId);
    setSubmitting(true);
    const now = new Date().toISOString();
    try {
      await TreasuryRepository.createExpense({
        id: crypto.randomUUID(),
        account_id: session.accountId,
        branch_id: activeBranchId ?? session?.branchId ?? '',
        category_id: form.categoryId || null,
        category_name: category?.name ?? null,
        treasury_account_id: form.treasuryId || null,
        title: form.title.trim(),
        amount_piasters: Math.round(Number(form.amount) * 100),
        expense_date: now,
        notes: null,
        created_at: now,
        last_modified: now,
        is_deleted: false,
        sync_version: 1,
      });
      toast.success('طھظ… طھط³ط¬ظٹظ„ ط§ظ„ظ…طµط±ظˆظپ.');
      setOpen(false);
      setForm({ title: '', amount: '', categoryId: '', treasuryId: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'طھط¹ط°ظ‘ط± طھط³ط¬ظٹظ„ ط§ظ„ظ…طµط±ظˆظپ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="ط§ظ„ظ…طµط±ظˆظپط§طھ"
      subtitle={`${total.toLocaleString('ar-EG')} ظ…طµط±ظˆظپ â€” ط¥ط¬ظ…ط§ظ„ظٹ ظ‡ط°ظ‡ ط§ظ„طµظپط­ط© ${fmt(totalAmount)}`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> ظ…طµط±ظˆظپ ط¬ط¯ظٹط¯
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>طھط³ط¬ظٹظ„ ظ…طµط±ظˆظپ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ط³ظ… ط§ظ„ظ…طµط±ظˆظپ</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ظ„ظ‚ظٹظ…ط© (ط¬.ظ…)</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ظ„ظپط¦ط©</Label>
                <Select value={form.categoryId || EMPTY_VALUE} onValueChange={(v) => setForm({ ...form, categoryId: v === EMPTY_VALUE ? '' : v })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>ط¨ط¯ظˆظ† ظپط¦ط©</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ظ„ط®ط²ظٹظ†ط©</Label>
                <Select value={form.treasuryId || EMPTY_VALUE} onValueChange={(v) => setForm({ ...form, treasuryId: v === EMPTY_VALUE ? '' : v })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>ط¨ط¯ظˆظ† ط®ط²ظٹظ†ط©</SelectItem>
                    {treasuries.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ط¥ظ„ط؛ط§ط،</Button>
                <Button type="submit" disabled={submitting} className="gap-2 rounded-xl">
                  {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  ط­ظپط¸
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex justify-start">
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="h-11 rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>ظƒظ„ ط§ظ„ظپط¦ط§طھ</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                <TableHead>ط§ظ„ظ…طµط±ظˆظپ</TableHead>
                <TableHead>ط§ظ„ظپط¦ط©</TableHead>
                <TableHead>ط§ظ„ظ‚ظٹظ…ط©</TableHead>
                <TableHead>ط§ظ„طھط§ط±ظٹط®</TableHead>
                <TableHead>ط§ظ„ظ…ط³ط¬ظ„ ط¨ظˆط§ط³ط·ط©</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
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
                      <Wallet className="w-8 h-8" />
                      <span className="text-xs font-bold">ظ„ط§ طھظˆط¬ط¯ ظ…طµط±ظˆظپط§طھ ظ…ط·ط§ط¨ظ‚ط©.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-xs font-black text-slate-800 dark:text-slate-100">{x.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{x.category_name || (x.category_id ? 'ظپط¦ط©' : '-')}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-black text-rose-600 dark:text-rose-400">{fmt(x.amount_piasters)}</TableCell>
                  <TableCell className="text-[11px] font-semibold text-slate-400">{fmtDate(x.expense_date)}</TableCell>
                  <TableCell className="text-[11px] font-semibold text-slate-400">{x.created_by_name || '-'}</TableCell>
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