'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSessionStore } from '@/core/state/useSessionStore';
import { formatNumber } from '@/lib/format';
import { toast } from 'sonner';
import { RefreshCw, BookOpen, Printer } from 'lucide-react';
import { AccountingRepository } from '@/modules/accounting/accounting_repository';
import { getAccountStatement, type LedgerRow } from '@/modules/accounting/accounting_reports';
import type { Account } from '@/types';

export default function GeneralLedgerPage() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [opening, setOpening] = useState(0);
  const [closing, setClosing] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve()
      .then(async () => {
        await AccountingRepository.ensureDefaultChartOfAccounts(orgId);
        const list = await AccountingRepository.listLeafAccounts(orgId);
        setAccounts(list.sort((a, b) => a.code.localeCompare(b.code)));
      })
      .catch((err) => console.error('Ledger accounts error:', err));
  }, [orgId]);

  const loadData = useCallback(async () => {
    if (!orgId || !accountId) {
      setRows([]);
      return;
    }
    try {
      setIsLoading(true);
      const result = await getAccountStatement(orgId, accountId, from || null, to || null);
      setRows(result.rows);
      setOpening(result.opening);
      setClosing(result.closing);
    } catch (err) {
      console.error('Ledger error:', err);
      toast.error('حدث خطأ أثناء تحميل دفتر الأستاذ');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, accountId, from, to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppShell
      title="دفتر الأستاذ العام"
      subtitle="حركة الحساب التفصيلية مع الرصيد الجاري (Running Balance) لكل حساب."
      actions={
        <Button onClick={loadData} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs gap-2 shadow-sm transition-all active:scale-95">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> تحديث
        </Button>
      }
    >
      <div className="space-y-6 text-right" dir="rtl">
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="text-[11px] font-black text-slate-400">الحساب</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                <SelectValue placeholder="اختر الحساب" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-black text-slate-400">من تاريخ</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 w-40 rounded-xl text-xs font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-black text-slate-400">إلى تاريخ</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 w-40 rounded-xl text-xs font-bold" />
          </div>
          <Button variant="outline" onClick={() => { setFrom(''); setTo(''); }} className="h-10 rounded-xl text-xs font-bold">
            مسح الفلتر
          </Button>
          <div className="flex items-center gap-4 ms-auto">
            <div className="text-[11px] font-black text-slate-400">
              رصيد افتتاحي: <span className="font-mono text-slate-700 dark:text-slate-200">{formatNumber(opening)}</span>
            </div>
            <div className="text-[11px] font-black text-slate-400">
              رصيد ختامي: <span className="font-mono text-blue-600">{formatNumber(closing)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 w-32">التاريخ</th>
                  <th className="py-4 px-4 w-32">رقم القيد</th>
                  <th className="py-4 px-4">البيان</th>
                  <th className="py-4 px-4 text-left w-28">مدين</th>
                  <th className="py-4 px-4 text-left w-28">دائن</th>
                  <th className="py-4 px-4 text-left w-32">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs font-bold">
                {rows.map((row, idx) => (
                  <tr key={`${row.entryNo}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 px-4 text-blue-600 font-black">#{row.entryNo}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-xs">{row.description}</td>
                    <td className="py-3 px-4 text-left font-mono text-blue-600">{row.debit ? formatNumber(row.debit) : '-'}</td>
                    <td className="py-3 px-4 text-left font-mono text-amber-600">{row.credit ? formatNumber(row.credit) : '-'}</td>
                    <td className="py-3 px-4 text-left font-mono text-slate-900 dark:text-white">{formatNumber(row.running)}</td>
                  </tr>
                ))}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-black">
                      {accountId ? 'لا توجد حركات لهذا الحساب في الفترة المحددة.' : 'اختر حساباً لعرض دفتر الأستاذ.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => window.print()} className="h-10 rounded-xl text-xs font-bold gap-2">
            <BookOpen className="w-4 h-4" /> <Printer className="w-4 h-4" /> طباعة
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
