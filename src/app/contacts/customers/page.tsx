'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Users, UserPlus, Building2 } from 'lucide-react';
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
import { ContactsRepository } from '@/core/pharmacy/contacts_repository';
import { piastersToEgp, type Customer } from '@/types/pharmacy';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CustomersPage() {
  const { session, activeBranchId } = useSessionStore();

  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  // New customer form
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', entityType: 'individual' });

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
      const result = await ContactsRepository.customers({
        branchId: activeBranchId,
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
        activeOnly: false,
      });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'طھط¹ط°ظ‘ط± طھط­ظ…ظٹظ„ ط§ظ„ط¹ظ…ظ„ط§ط،.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [activeBranchId, debouncedSearch, page]);

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
      toast.error('ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ ظ…ط·ظ„ظˆط¨.');
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    try {
      await ContactsRepository.createCustomer({
        id: crypto.randomUUID(),
        account_id: session.accountId,
        branch_id: activeBranchId ?? session?.branchId ?? '',
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        entity_type: form.entityType,
        balance_piasters: 0,
        opening_balance_piasters: 0,
        advance_balance_piasters: 0,
        max_credit_piasters: 0,
        is_active: true,
        is_deleted: false,
        sync_version: 1,
        created_at: now,
        last_modified: now,
      });
      toast.success('طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظٹظ„.');
      setOpen(false);
      setForm({ name: '', phone: '', email: '', address: '', entityType: 'individual' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'طھط¹ط°ظ‘ط± ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظٹظ„.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="ط§ظ„ط¹ظ…ظ„ط§ط،"
      subtitle={`ط¥ط¬ظ…ط§ظ„ظٹ ${total.toLocaleString('ar-EG')} ط¹ظ…ظٹظ„`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <UserPlus className="w-4 h-4" /> ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ط¥ط¶ط§ظپط© ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" required className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-right block text-xs font-bold">ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block text-xs font-bold">ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@domain.com" className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ط§ظ„ط¹ظ†ظˆط§ظ†</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="ط§ظ„ط¹ظ†ظˆط§ظ†" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-right block text-xs font-bold">ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„</Label>
                <Select value={form.entityType} onValueChange={(v) => setForm({ ...form, entityType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">ظپط±ط¯ظٹ</SelectItem>
                    <SelectItem value="company">ط´ط±ظƒط©</SelectItem>
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
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ط§ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ…طŒ ط§ظ„ظ‡ط§طھظپطŒ ط£ظˆ ط§ظ„ظƒظˆط¯..."
              className="pr-10 h-11 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
            />
          </div>
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
                <TableHead>ط§ظ„ظƒظˆط¯</TableHead>
                <TableHead>ط§ظ„ط¹ظ…ظٹظ„</TableHead>
                <TableHead>ط§ظ„ظ‡ط§طھظپ</TableHead>
                <TableHead>ط§ظ„ظ†ظˆط¹</TableHead>
                <TableHead>ط§ظ„ط±طµظٹط¯</TableHead>
                <TableHead>ط£ظ‚طµظ‰ ط¢ط¬ظ„</TableHead>
                <TableHead>ط§ظ„ط­ط§ظ„ط©</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 7 }).map((__, c) => (
                    <TableCell key={c}><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users className="w-8 h-8" />
                      <span className="text-xs font-bold">ظ„ط§ ظٹظˆط¬ط¯ ط¹ظ…ظ„ط§ط، ظ…ط·ط§ط¨ظ‚ظˆظ†.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs font-semibold text-slate-400">{c.code || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500">{c.phone || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500">
                    {c.entity_type === 'company' ? 'ط´ط±ظƒط©' : c.entity_type === 'individual' ? 'ظپط±ط¯ظٹ' : (c.entity_type || '-')}
                  </TableCell>
                  <TableCell className={cn('text-xs font-black', Number(c.balance_piasters ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {fmt(c.balance_piasters)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500">{fmt(c.max_credit_piasters)}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'ظ†ط´ط·' : 'ظ…ظˆظ‚ظˆظپ'}</Badge>
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