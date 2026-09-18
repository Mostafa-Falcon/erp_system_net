'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Landmark, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PaginationRtl } from '@/components/PaginationRtl';
import { useSessionStore } from '@/core/state/useSessionStore';
import { TreasuryRepository } from '@/core/pharmacy/treasury_repository';
import { piastersToEgp, type Treasury } from '@/types/pharmacy';
import { toast } from 'sonner';

const PAGE_SIZE = 25;

export default function TreasuriesPage() {
  const { session, activeBranchId } = useSessionStore();
  const [items, setItems] = useState<Treasury[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', notes: '' });

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await TreasuryRepository.treasuries({
        branchId: activeBranchId,
        page,
        pageSize: PAGE_SIZE,
      });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'طھط¹ط°ظ‘ط± طھط­ظ…ظٹظ„ ط§ظ„ط®ط²ط§ط¦ظ†.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [activeBranchId, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('falcon_data_changed', load);
    return () => window.removeEventListener('falcon_data_changed', load);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!form.name.trim()) {
      toast.error('ط§ط³ظ… ط§ظ„ط®ط²ظٹظ†ط© ظ…ط·ظ„ظˆط¨.');
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    try {
      await TreasuryRepository.createTreasury({
        id: crypto.randomUUID(),
        account_id: session.accountId,
        branch_id: activeBranchId ?? session?.branchId ?? '',
        name: form.name.trim(),
        code: form.code.trim() || null,
        is_main: false,
        is_active: true,
        balance_piasters: 0,
        notes: form.notes.trim() || null,
        created_at: now,
        last_modified: now,
        is_deleted: false,
        sync_version: 1,
      });
      toast.success('طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط®ط²ظٹظ†ط©.');
      setOpen(false);
      setForm({ name: '', code: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'طھط¹ط°ظ‘ط± ط¥ظ†ط´ط§ط، ط§ظ„ط®ط²ظٹظ†ط©.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="ط§ظ„ط®ط²ط§ط¦ظ†"
      subtitle={`ط¥ط¬ظ…ط§ظ„ظٹ ${total.toLocaleString('ar-EG')} ط®ط²ظٹظ†ط©`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> ط®ط²ظٹظ†ط© ط¬ط¯ظٹط¯ط©
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ط¥ط¶ط§ظپط© ط®ط²ظٹظ†ط© ط¬ط¯ظٹط¯ط©</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ط³ظ… ط§ظ„ط®ط²ظٹظ†ط©</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-right block text-xs font-bold">ط§ظ„ظƒظˆط¯</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block text-xs font-bold">ظ…ظ„ط§ط­ط¸ط§طھ</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-11 rounded-xl" />
                </div>
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
                <TableHead>ط§ظ„ط®ط²ظٹظ†ط©</TableHead>
                <TableHead>ط§ظ„ظƒظˆط¯</TableHead>
                <TableHead>ط§ظ„ظ†ظˆط¹</TableHead>
                <TableHead>ط§ظ„ط±طµظٹط¯ ط§ظ„ط­ط§ظ„ظٹ</TableHead>
                <TableHead>ط§ظ„ظ…ظ„ط§ط­ط¸ط§طھ</TableHead>
                <TableHead>ط§ظ„ط­ط§ظ„ط©</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 6 }).map((__, c) => (
                    <TableCell key={c}><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Landmark className="w-8 h-8" />
                      <span className="text-xs font-bold">ظ„ط§ طھظˆط¬ط¯ ط®ط²ط§ط¦ظ†.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{t.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-400">{t.code || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_main ? 'info' : 'secondary'}>{t.is_main ? 'ط§ظ„ط±ط¦ظٹط³ظٹط©' : 'ظپط±ط¹ظٹط©'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-black text-slate-800 dark:text-slate-100">
                    {piastersToEgp(t.balance_piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500">{t.notes || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'success' : 'secondary'}>{t.is_active ? 'ظ†ط´ط·ط©' : 'ظ…ظˆظ‚ظˆظپط©'}</Badge>
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