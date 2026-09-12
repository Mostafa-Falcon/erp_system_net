'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import type { CashierShift, Treasury, User } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

function ShiftsContent() {
  const { currentUser, activeBranchId } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const branchId = activeBranchId || currentUser?.branch_id || '';

  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openingBalance, setOpeningBalance] = useState('0');
  const [openTreasuryId, setOpenTreasuryId] = useState('');
  const [actualClosing, setActualClosing] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const loadData = async () => {
    if (!orgId || !branchId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [sft, tres, usrs] = await Promise.all([
        SalesRepository.getShifts(branchId),
        db.treasuries.where('org_id').equals(orgId).and((t) => t.is_active).toArray(),
        db.users.where('org_id').equals(orgId).toArray(),
      ]);
      setShifts(sft);
      setTreasuries(tres);
      setUsers(usrs);
      if (tres.length > 0) setOpenTreasuryId((prev) => prev || tres.find((t) => t.is_default)?.id || tres[0].id);
    } catch (err) {
      console.error('Load shifts error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId || !branchId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, branchId]);

  const myOpenShift = shifts.find((s) => s.user_id === currentUser?.id && s.status === 'open');

  const openShift = async () => {
    setFormError('');
    if (!currentUser) return;
    if (!openTreasuryId) {
      setFormError('اختر خزينة الوردية.');
      return;
    }
    setIsBusy(true);
    try {
      await SalesRepository.openShift({
        orgId,
        branchId,
        userId: currentUser.id,
        treasuryId: openTreasuryId,
        openingBalance: Number(openingBalance) || 0,
      });
      setOpeningBalance('0');
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء فتح الوردية.');
    } finally {
      setIsBusy(false);
    }
  };

  const closeShift = async () => {
    setFormError('');
    if (!myOpenShift) return;
    setIsBusy(true);
    try {
      await SalesRepository.closeShift(myOpenShift.id, Number(actualClosing) || 0, closeNotes.trim() || undefined);
      setActualClosing('');
      setCloseNotes('');
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء إغلاق الوردية.');
    } finally {
      setIsBusy(false);
    }
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.username || '—';
  const treasuryName = (id: string) => treasuries.find((t) => t.id === id)?.name || '—';

  const closedToday = shifts.filter(
    (s) => s.status === 'closed' && new Date(s.closed_at || s.opened_at).toDateString() === new Date().toDateString()
  );
  const expectedOpen = shifts.filter((s) => s.status === 'open').reduce((a, s) => a + s.expected_closing_balance, 0);

  return (
    <AppShell title="ورديات الكاشير" subtitle="فتح وإغلاق وردية الكاشير مع تسوية النقدية والفرق (عجز / زيادة)">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="ورديات مفتوحة" value={String(shifts.filter((s) => s.status === 'open').length)} accent="#558b2f" />
          <Kpi label="ورديات مُغلقة اليوم" value={String(closedToday.length)} accent="#2563eb" />
          <Kpi label="المتوقع الكلي المفتوح" value={formatNumber(expectedOpen)} accent="#d97706" />
          <Kpi label="إجمالي الورديات" value={String(shifts.length)} accent="#64748b" />
        </div>

        {/* Open / close panel */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          {myOpenShift ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#558b2f]"><Icons.CashRegister /></span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      وردية مفتوحة #{myOpenShift.shift_number}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    الخزينة: {treasuryName(myOpenShift.treasury_id)} · فُتحت {formatDateTime(myOpenShift.opened_at)}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-[10px] font-black">مفتوحة</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div><div className="text-[10px] font-black text-slate-400">رصيد البداية</div><div className="mt-0.5 font-black">{formatNumber(myOpenShift.opening_balance)}</div></div>
                <div><div className="text-[10px] font-black text-slate-400">مبيعات نقدي</div><div className="mt-0.5 font-black text-emerald-600 dark:text-emerald-400">{formatNumber(myOpenShift.total_sales_cash)}</div></div>
                <div><div className="text-[10px] font-black text-slate-400">مبيعات بطاقة</div><div className="mt-0.5 font-black">{formatNumber(myOpenShift.total_sales_card)}</div></div>
                <div><div className="text-[10px] font-black text-slate-400">مبيعات آجل</div><div className="mt-0.5 font-black">{formatNumber(myOpenShift.total_sales_credit)}</div></div>
                <div><div className="text-[10px] font-black text-slate-400">مرتجعات نقدي</div><div className="mt-0.5 font-black text-red-500">{formatNumber(myOpenShift.total_returns_cash)}</div></div>
                <div><div className="text-[10px] font-black text-slate-400">المصروفات</div><div className="mt-0.5 font-black text-red-500">{formatNumber(myOpenShift.total_expenses)}</div></div>
                <div className="col-span-2">
                  <div className="text-[10px] font-black text-slate-400">الرصيد المتوقع</div>
                  <div className="mt-0.5 text-sm font-black text-[#558b2f]">{formatNumber(myOpenShift.expected_closing_balance)}</div>
                </div>
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">العد الفعلي للنقدية</span>
                  <Input type="number" min={0} step="any" value={actualClosing} onChange={(e) => setActualClosing(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" placeholder="المبلغ الفعلي" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات الإغلاق</span>
                  <Input type="text" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" placeholder="اختياري" />
                  {Number(actualClosing) !== 0 && Number(actualClosing) - myOpenShift.expected_closing_balance !== 0 && (
                    <p className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      الفرق المتوقع: {formatNumber(Number(actualClosing) - myOpenShift.expected_closing_balance)} (عجز أو زيادة)
                    </p>
                  )}
                </div>
                <Button onClick={closeShift} disabled={isBusy} className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5">
                  {isBusy ? 'جارِ الإغلاق...' : 'إغلاق الوردية'} <Icons.SwitchArrows />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[#558b2f]"><Icons.CashRegister /></span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">ليس لديك وردية مفتوحة</h3>
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الخزينة</span>
                  <select value={openTreasuryId} onChange={(e) => setOpenTreasuryId(e.target.value)} className={selectCls + ' w-full'}>
                    {treasuries.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({formatNumber(t.current_balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رصيد البداية</span>
                  <Input type="number" min={0} step="any" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" placeholder="0" />
                </div>
                <Button onClick={openShift} disabled={isBusy} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5">
                  {isBusy ? 'جارِ الفتح...' : 'فتح وردية'} <Icons.Plus />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">سجل الورديات</h3>

          {isLoading ? (
            <div className="py-10 text-center text-sm font-bold text-slate-400">جارٍ تحميل الورديات...</div>
          ) : shifts.length === 0 ? (
            <div className="py-10 text-center text-sm font-bold text-slate-400">لا توجد ورديات بعد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                    <th className="py-2.5 pr-3">الوردية</th>
                    <th className="py-2.5">الكاشير</th>
                    <th className="py-2.5">الخزينة</th>
                    <th className="py-2.5">الفتح</th>
                    <th className="py-2.5">الإغلاق</th>
                    <th className="py-2.5">المتوقع</th>
                    <th className="py-2.5">الفعلي</th>
                    <th className="py-2.5 pl-3">الفرق</th>
                    <th className="py-2.5 pl-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => {
                    const diff = s.actual_closing_balance !== null && s.actual_closing_balance !== undefined ? (s.actual_closing_balance - s.expected_closing_balance) : null;
                    return (
                      <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <td className="py-3 pr-3 font-black">#{s.shift_number}</td>
                        <td className="py-3">{userName(s.user_id)}</td>
                        <td className="py-3 text-[11px]">{treasuryName(s.treasury_id)}</td>
                        <td className="py-3 text-[11px]">{formatDateTime(s.opened_at)}</td>
                        <td className="py-3 text-[11px]">{s.closed_at ? formatDateTime(s.closed_at) : '—'}</td>
                        <td className="py-3">{formatNumber(s.expected_closing_balance)}</td>
                        <td className="py-3">{s.actual_closing_balance !== null && s.actual_closing_balance !== undefined ? formatNumber(s.actual_closing_balance) : '—'}</td>
                        <td className="py-3 pl-3">
                          {diff === null ? (
                            <span className="text-slate-400">—</span>
                          ) : diff === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">مطابق</span>
                          ) : diff > 0 ? (
                            <span className="text-teal-600 dark:text-teal-400">زيادة {formatNumber(diff)}</span>
                          ) : (
                            <span className="text-red-500">عجز {formatNumber(Math.abs(diff))}</span>
                          )}
                        </td>
                        <td className="py-3 pl-3">
                          {s.status === 'open' ? (
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-black">مفتوحة</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 text-[10px] font-black">مُغلقة</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800 p-4">
      <div className="text-[10px] font-black text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black" style={{ color: accent }}>{value}</div>
    </div>
  );
}

export default function ShiftsPage() {
  return <ShiftsContent />;
}