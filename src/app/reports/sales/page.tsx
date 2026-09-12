'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { formatNumber, formatDate } from '@/lib/format';
import type { Branch, Contact, SalesInvoice, SalesInvoiceItem, SalesReturn, User } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function SalesReportContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [items, setItems] = useState<SalesInvoiceItem[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [from, setFrom] = useState(() => daysAgoISO(29));
  const [to, setTo] = useState(() => todayISO());
  const [branchFilter, setBranchFilter] = useState('');
  const [appliedFrom, setAppliedFrom] = useState(from);
  const [appliedTo, setAppliedTo] = useState(to);
  const [appliedBranch, setAppliedBranch] = useState('');

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [inv, ret, brs, custs, usrs, prods] = await Promise.all([
        SalesRepository.getSalesInvoices(orgId),
        SalesRepository.getSalesReturns(orgId),
        db.branches.where('org_id').equals(orgId).toArray(),
        db.contacts.where('org_id').equals(orgId).toArray(),
        db.users.where('org_id').equals(orgId).toArray(),
        db.products.where('org_id').equals(orgId).toArray(),
      ]);
      setInvoices(inv);
      setReturns(ret);
      setBranches(brs);
      setCustomers(custs);
      setUsers(usrs);
      setProducts(prods.map((p) => ({ id: p.id, name: p.name })));

      const ids = inv.map((i) => i.id);
      const allItems = ids.length
        ? await db.sales_invoice_items.where('invoice_id').anyOf(ids).toArray()
        : [];
      setItems(allItems);
    } catch (err) {
      console.error('Load sales report error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const applyFilters = () => {
    setAppliedFrom(from);
    setAppliedTo(to);
    setAppliedBranch(branchFilter);
  };

  const range = useMemo(() => {
    const fromMs = new Date(appliedFrom + 'T00:00:00').getTime();
    const toMs = new Date(appliedTo + 'T23:59:59.999').getTime();
    return { fromMs, toMs };
  }, [appliedFrom, appliedTo]);

  const scopedInvoices = useMemo(() => {
    return invoices.filter(
      (i) =>
        i.status === 'completed' &&
        i.invoice_date >= new Date(range.fromMs).toISOString() &&
        i.invoice_date <= new Date(range.toMs).toISOString() &&
        (!appliedBranch || i.branch_id === appliedBranch)
    );
  }, [invoices, range, appliedBranch]);

  const scopedItems = useMemo(() => {
    const idSet = new Set(scopedInvoices.map((i) => i.id));
    return items.filter((it) => idSet.has(it.invoice_id));
  }, [items, scopedInvoices]);

  const scopedReturns = useMemo(() => {
    return returns.filter(
      (r) =>
        r.return_date >= new Date(range.fromMs).toISOString() &&
        r.return_date <= new Date(range.toMs).toISOString() &&
        (!appliedBranch || r.branch_id === appliedBranch)
    );
  }, [returns, range, appliedBranch]);

  const report = useMemo(() => {
    const revenue = scopedInvoices.reduce((a, i) => a + i.total, 0);
    let cost = 0;
    let cash = 0;
    let card = 0;
    let credit = 0;
    for (const i of scopedInvoices) {
      cash += i.cash_amount;
      card += i.card_amount;
      credit += i.remaining_amount;
    }
    const lineTotals = scopedItems.reduce((a, it) => a + it.total, 0);
    const lineCost = scopedItems.reduce((a, it) => a + it.quantity * it.unit_cost, 0);
    cost = lineCost;

    const returnsTotal = scopedReturns.reduce((a, r) => a + r.total, 0);
    const profit = lineTotals - cost - returnsTotal;
    const netRevenue = revenue - returnsTotal;

    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const it of scopedItems) {
      const p = byProduct[it.product_id] || { name: products.find((x) => x.id === it.product_id)?.name || '—', qty: 0, revenue: 0 };
      p.qty += it.quantity;
      p.revenue += it.total;
      byProduct[it.product_id] = p;
    }
    const topProducts = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const byDay: Record<string, { count: number; revenue: number }> = {};
    for (const i of scopedInvoices) {
      const day = i.invoice_date.slice(0, 10);
      const rec = byDay[day] || { count: 0, revenue: 0 };
      rec.count += 1;
      rec.revenue += i.total;
      byDay[day] = rec;
    }
    const trend = Object.entries(byDay)
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14);

    return {
      revenue,
      netRevenue,
      profit,
      margin: netRevenue > 0 ? (profit / netRevenue) * 100 : 0,
      count: scopedInvoices.length,
      avgInvoice: scopedInvoices.length ? revenue / scopedInvoices.length : 0,
      cash,
      card,
      credit,
      returnsTotal,
      returnsCount: scopedReturns.length,
      topProducts,
      trend,
    };
  }, [scopedInvoices, scopedItems, scopedReturns, products]);

  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name || '—';
  const customerName = (id?: string | null) => (id ? customers.find((c) => c.id === id)?.name : undefined);
  const userName = (id: string) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.username || '—';

  const maxTrend = Math.max(1, ...report.trend.map((t) => t.revenue));

  return (
    <AppShell title="تقرير المبيعات والأرباح" subtitle="تحليل الإيرادات والأرباح وطرق الدفع وأفضل المنتجات مبيعاً خلال الفترة">
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">من تاريخ</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls + ' w-40'} />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">إلى تاريخ</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls + ' w-40'} />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الفرع</span>
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className={selectCls + ' w-44'}>
                <option value="">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={applyFilters} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Icons.Refresh /> عرض التقرير
            </Button>
            <div className="flex-1" />
            <span className="text-[11px] font-semibold text-slate-400">
              الفترة: {formatDate(appliedFrom)} ← {formatDate(appliedTo)}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm font-bold text-slate-400">جارٍ حساب التقرير...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
              <Kpi label="صافي الإيرادات" value={formatNumber(report.netRevenue)} accent="#558b2f" />
              <Kpi label="الربح" value={formatNumber(report.profit)} accent="#2563eb" />
              <Kpi label="هامش الربح" value={report.margin.toFixed(1) + '%'} accent="#d97706" />
              <Kpi label="عدد الفواتير" value={String(report.count)} accent="#64748b" />
              <Kpi label="متوسط قيمة الفاتورة" value={formatNumber(report.avgInvoice)} accent="#0f766e" />
              <Kpi label={`مرتجعات (${report.returnsCount})`} value={formatNumber(report.returnsTotal)} accent="#dc2626" />
              <Kpi label="مبيعات نقدي" value={formatNumber(report.cash)} accent="#16a34a" />
              <Kpi label="مبيعات بطاقة" value={formatNumber(report.card)} accent="#4338ca" />
            </div>

            {/* Trend + top products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="lg:col-span-2 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">تطور المبيعات اليومي (آخر 14 يوم)</h3>
                <div className="flex items-end gap-1.5 h-40">
                  {report.trend.map((t) => (
                    <div key={t.day} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400">{formatNumber(t.revenue)}</span>
                      <div
                        className="w-full rounded-t-md bg-[#558b2f] hover:bg-[#436d25] transition-colors"
                        style={{ height: `${Math.max(4, (t.revenue / maxTrend) * 100)}%` }}
                        title={`${t.day} — ${t.count} فاتورة — ${formatNumber(t.revenue)}`}
                      />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate w-full text-center">{t.day.slice(5)}</span>
                    </div>
                  ))}
                  {report.trend.length === 0 && (
                    <div className="flex-1 text-center text-xs font-bold text-slate-400 py-10">لا توجد مبيعات في الفترة.</div>
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">الأعلى مبيعاً</h3>
                <div className="space-y-3">
                  {report.topProducts.map((p, idx) => (
                    <div key={p.name + idx} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                        <div className="text-[10px] font-semibold text-slate-400">كمية: {formatNumber(p.qty)}</div>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{formatNumber(p.revenue)}</span>
                    </div>
                  ))}
                  {report.topProducts.length === 0 && (
                    <div className="text-center text-xs font-bold text-slate-400 py-8">لا توجد منتجات.</div>
                  )}
                </div>
              </section>
            </div>

            {/* Invoices table */}
            <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">فواتير الفترة ({report.count})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                      <th className="py-2.5 pr-3">الفاتورة</th>
                      <th className="py-2.5">العميل</th>
                      <th className="py-2.5">الفرع</th>
                      <th className="py-2.5">الدفع</th>
                      <th className="py-2.5">التاريخ</th>
                      <th className="py-2.5">الكاشير</th>
                      <th className="py-2.5 pl-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedInvoices
                      .slice()
                      .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date))
                      .map((i) => (
                        <tr key={i.id} className="border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <td className="py-3 pr-3 font-black text-slate-900 dark:text-white">{i.invoice_number}</td>
                          <td className="py-3 text-[11px]">{customerName(i.customer_id) || 'نقدي'}</td>
                          <td className="py-3 text-[11px]">{branchName(i.branch_id)}</td>
                          <td className="py-3">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {i.payment_type === 'cash' ? 'نقدي' : i.payment_type === 'card' ? 'بطاقة' : i.payment_type === 'credit' ? 'آجل' : 'مقسم'}
                            </span>
                          </td>
                          <td className="py-3 text-[11px]">{formatDate(i.invoice_date.slice(0, 10))}</td>
                          <td className="py-3 text-[11px]">{userName(i.created_by)}</td>
                          <td className="py-3 pl-3 font-black text-[#558b2f]">{formatNumber(i.total)}</td>
                        </tr>
                      ))}
                    {scopedInvoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs font-bold text-slate-400">لا توجد فواتير في هذه الفترة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
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

export default function SalesReportPage() {
  return <SalesReportContent />;
}