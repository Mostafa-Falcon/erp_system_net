'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { TreasuryRepository } from '@/modules/treasury/treasury_repository';
import { formatNumber } from '@/lib/format';
import type { Expense, FinancialVoucher, PurchaseInvoice, SalesInvoice, SalesReturn, Treasury } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const TYPE_LABELS: Record<string, string> = {
  safe: 'خزينة نقدية',
  bank: 'حساب بنكي',
  pos_terminal: 'ماكينة POS',
};

function TreasuriesContent() {
  const { currentUser, activeBranchId } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const branchId = activeBranchId || currentUser?.branch_id || '';

  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [vouchers, setVouchers] = useState<FinancialVoucher[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'safe' | 'bank' | 'pos_terminal'>('safe');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [tres, vch, exp, sal, ret, pur] = await Promise.all([
        TreasuryRepository.getTreasuries(orgId),
        TreasuryRepository.getVouchers(orgId),
        TreasuryRepository.getExpenses(orgId),
        db.sales_invoices.where('org_id').equals(orgId).toArray(),
        db.sales_returns.where('org_id').equals(orgId).toArray(),
        db.purchase_invoices.where('org_id').equals(orgId).toArray(),
      ]);
      setTreasuries(tres);
      setVouchers(vch);
      setExpenses(exp);
      setSales(sal);
      setSalesReturns(ret);
      setPurchases(pur);
    } catch (err) {
      console.error('Load treasuries error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const totals = useMemo(() => {
    let totalBalance = 0;
    let cashSafe = 0;
    let bankTotal = 0;
    for (const t of treasuries) {
      totalBalance += t.current_balance;
      if (t.type === 'safe') cashSafe += t.current_balance;
      if (t.type === 'bank') bankTotal += t.current_balance;
    }
    const cards = treasuries.filter((t) => t.type === 'pos_terminal').reduce((a, t) => a + t.current_balance, 0);
    return { totalBalance, cashSafe, bankTotal, cards, count: treasuries.length };
  }, [treasuries]);

  const createTreasury = async () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('أدخل اسم الخزينة.');
      return;
    }
    if (Number(openingBalance) < 0) {
      setFormError('الرصيد الافتتاحي لا يمكن أن يكون سالباً.');
      return;
    }
    setIsBusy(true);
    try {
      await TreasuryRepository.createTreasury({
        orgId,
        branchId,
        name: name.trim(),
        type,
        openingBalance: Number(openingBalance) || 0,
        isDefault: isDefault || treasuries.length === 0,
      });
      setName('');
      setType('safe');
      setOpeningBalance('0');
      setIsDefault(false);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الخزينة.');
    } finally {
      setIsBusy(false);
    }
  };

  const makeDefault = async (id: string) => {
    try {
      await TreasuryRepository.setDefaultTreasury(id, orgId);
      await loadData();
    } catch (err) {
      console.error('Set default treasury error:', err);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await TreasuryRepository.toggleTreasuryActive(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ أثناء تحديث الخزينة.');
    }
  };

  const detail = detailId ? treasuries.find((t) => t.id === detailId) : undefined;
  const detailStats = useMemo(() => {
    if (!detailId) return null;
    const v = vouchers.filter((x) => x.treasury_id === detailId);
    const e = expenses.filter((x) => x.treasury_id === detailId);
    const s = sales.filter((x) => x.treasury_id === detailId && x.payment_type !== 'credit' && x.cash_amount > 0);
    const r = salesReturns.filter((x) => x.treasury_id === detailId);
    const p = purchases.filter((x) => x.treasury_id === detailId && x.paid_amount > 0);
    return {
      receipts: v.filter((x) => x.type === 'receipt').reduce((a, x) => a + x.amount, 0),
      payments: v.filter((x) => x.type === 'payment').reduce((a, x) => a + x.amount, 0),
      expenses: e.reduce((a, x) => a + x.amount, 0),
      salesCash: s.reduce((a, x) => a + x.cash_amount, 0),
      salesReturns: r.reduce((a, x) => a + x.refunded_amount, 0),
      purchasesPaid: p.reduce((a, x) => a + x.paid_amount, 0),
    };
  }, [detailId, vouchers, expenses, sales, salesReturns, purchases]);

  return (
    <AppShell title="الخزائن والبنوك" subtitle="إدارة الخزائن النقدية والحسابات البنكية وماكينات نقاط البيع وأرصدتها">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="إجمالي الأرصدة" value={formatNumber(totals.totalBalance)} accent="#558b2f" />
          <Kpi label="الخزائن النقدية" value={formatNumber(totals.cashSafe)} accent="#d97706" />
          <Kpi label="الحسابات البنكية" value={formatNumber(totals.bankTotal)} accent="#2563eb" />
          <Kpi label="ماكينات POS" value={formatNumber(totals.cards)} accent="#0f766e" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">قائمة الخزائن ({treasuries.length})</h3>
            <Button onClick={() => setShowCreate((v) => !v)} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              {showCreate ? 'إلغاء' : 'إضافة خزينة'} {showCreate ? <Icons.X /> : <Icons.Plus />}
            </Button>
          </div>

          {showCreate && (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الخزينة</span>
                  <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="مثال: خزينة الفرع الرئيسي" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">النوع</span>
                  <select value={type} onChange={(e) => setType(e.target.value as 'safe' | 'bank' | 'pos_terminal')} className={selectCls + ' w-full'}>
                    <option value="safe">خزينة نقدية</option>
                    <option value="bank">حساب بنكي</option>
                    <option value="pos_terminal">ماكينة POS</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرصيد الافتتاحي</span>
                  <Input type="number" min={0} step="any" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="0" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer h-10 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={isDefault || treasuries.length === 0} disabled={treasuries.length === 0} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 accent-[#558b2f]" />
                    خزينة رئيسية
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={createTreasury} disabled={isBusy} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold">
                  {isBusy ? 'جارِ الإنشاء...' : 'إنشاء الخزينة'}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">جارٍ تحميل الخزائن...</div>
          ) : treasuries.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icons.Accounts /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد خزائن بعد.</p>
              <p className="mt-1 text-xs text-slate-400">أنشئ خزينة نقدية للبدء بالعمليات المالية.</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {treasuries.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'bank' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400' : t.type === 'pos_terminal' ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#558b2f]'}`}>
                        <Icons.Accounts />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{t.name}</span>
                          {t.is_default && (
                            <span className="rounded-full bg-[#558b2f]/10 text-[#558b2f] dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black">رئيسية</span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">{TYPE_LABELS[t.type]}</span>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3">
                    <div className="text-[10px] font-black text-slate-400">الرصيد الحالي</div>
                    <div className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">{formatNumber(t.current_balance)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={() => setDetailId(t.id)} className="h-8 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 flex-1">
                      <Icons.Eye /> التفاصيل
                    </Button>
                    {!t.is_default && (
                      <Button onClick={() => makeDefault(t.id)} className="h-8 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold flex-1">
                        جعلها رئيسية
                      </Button>
                    )}
                    <Button
                      onClick={() => toggleActive(t.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500"
                      title={t.is_active ? 'إيقاف' : 'تفعيل'}
                    >
                      <Icons.X />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {detail && detailStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailId(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#131b2e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{detail.name}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {TYPE_LABELS[detail.type]} · رصيد: {formatNumber(detail.current_balance)}
                </p>
              </div>
              <button onClick={() => setDetailId(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><Icons.X /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Stat label="سندات قبض" value={formatNumber(detailStats.receipts)} accent="#558b2f" />
              <Stat label="سندات صرف" value={formatNumber(detailStats.payments)} accent="#d97706" />
              <Stat label="مصروفات" value={formatNumber(detailStats.expenses)} accent="#ef4444" />
              <Stat label="مبيعات نقدي" value={formatNumber(detailStats.salesCash)} accent="#0f766e" />
              <Stat label="مرتجعات مبيعات" value={formatNumber(detailStats.salesReturns)} accent="#dc2626" />
              <Stat label="مدفوعات مشتريات" value={formatNumber(detailStats.purchasesPaid)} accent="#4338ca" />
            </div>

            <p className="text-[10px] font-bold text-slate-400 mb-2">آخر السندات والمصروفات</p>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
              {[...vouchers.filter((x) => x.treasury_id === detail.id), ...expenses.filter((x) => x.treasury_id === detail.id)]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, 10)
                .map((entry) => {
                  if ('voucher_no' in entry) {
                    const isReceipt = entry.type === 'receipt';
                    return (
                      <div key={entry.voucher_no} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black w-fit shrink-0 ${isReceipt ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
                            {isReceipt ? 'قبض' : 'صرف'}
                          </span>
                          <span className="truncate">{entry.voucher_no}</span>
                          <span className="text-[10px] text-slate-400 truncate">{entry.description}</span>
                        </div>
                        <span className={`shrink-0 ${isReceipt ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {isReceipt ? '+' : '-'}{formatNumber(entry.amount)}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black w-fit shrink-0 bg-red-50 dark:bg-red-950/40 text-red-500">مصروف</span>
                        <span className="truncate">{entry.description}</span>
                      </div>
                      <span className="shrink-0 text-red-500">-{formatNumber(entry.amount)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
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

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3">
      <div className="text-[10px] font-black text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-black" style={{ color: accent }}>{value}</div>
    </div>
  );
}

export default function TreasuriesPage() {
  return <TreasuriesContent />;
}