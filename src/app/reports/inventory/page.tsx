'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { formatNumber, formatDateTime, MOVEMENT_TYPE_LABELS } from '@/lib/format';
import type { InventoryTransaction, InventoryTransactionType, Product, Unit, Warehouse } from '@/types';

const TYPE_STYLES: Record<string, string> = {
  opening_stock: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  purchase: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  sale: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
  sale_return: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
  purchase_return: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  transfer_in: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  transfer_out: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  adjustment_in: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  adjustment_out: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
  damaged: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

function InventoryReportContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!orgId) return;
    let mounted = true;
    const load = async () => {
      const { db } = await import('@/core/db/app_database');
      try {
        const [trans, prods, whs, unts] = await Promise.all([
          db.inventory_transactions.where('org_id').equals(orgId).reverse().sortBy('created_at'),
          db.products.where('org_id').equals(orgId).toArray(),
          db.warehouses.where('org_id').equals(orgId).toArray(),
          db.units.where('org_id').equals(orgId).toArray(),
        ]);
        if (!mounted) return;
        setTransactions(trans);
        setProducts(prods);
        setWarehouses(whs);
        const umap: Record<string, Unit> = {};
        for (const u of unts) umap[u.id] = u;
        setUnitsById(umap);
      } catch (err) {
        console.error('Load inventory report error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [orgId]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (warehouseFilter !== 'all' && t.warehouse_id !== warehouseFilter) return false;
      if (typeFilter !== 'all' && t.transaction_type !== typeFilter) return false;
      if (productFilter !== 'all' && t.product_id !== productFilter) return false;
      if (dateFrom && t.created_at < new Date(dateFrom).toISOString()) return false;
      if (dateTo && t.created_at > new Date(dateTo + 'T23:59:59').toISOString()) return false;
      return true;
    });
  }, [transactions, warehouseFilter, typeFilter, productFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    let inbound = 0;
    let outbound = 0;
    for (const t of filtered) {
      if (t.base_quantity >= 0) inbound += t.base_quantity;
      else outbound += -t.base_quantity;
    }
    const net = inbound - outbound;
    return { inbound, outbound, net };
  }, [filtered]);

  const productName = (id?: string) => products.find((p) => p.id === id)?.name || id?.slice(0, 8) || '—';
  const warehouseName = (id?: string) => warehouses.find((w) => w.id === id)?.name || id?.slice(0, 8) || '—';
  const unitSymbol = (id?: string) => (id ? unitsById[id]?.symbol : '') || '';

  return (
    <AppShell
      title="تقرير حركة المخزون"
      subtitle="كشف قيد حركة المخزون: الوارد والصادر والرصيد بعد كل حركة — قابل للطباعة"
      actions={
        <Button
          onClick={() => window.print()}
          className="h-10 px-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-2"
        >
          <Icons.Print /> طباعة التقرير
        </Button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">إجمالي الوارد</span>
          <div className="text-xl font-black text-emerald-600 mt-1">{formatNumber(totals.inbound)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">إجمالي الصادر</span>
          <div className="text-xl font-black text-red-600 mt-1">{formatNumber(totals.outbound)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">صافي الحركة</span>
          <div className={`text-xl font-black mt-1 ${totals.net >= 0 ? 'text-[#558b2f]' : 'text-red-600'}`}>
            {formatNumber(totals.net)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 flex-wrap bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className={selectCls}>
          <option value="all">كل المخازن</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
          <option value="all">كل أنواع الحركة</option>
          {(Object.keys(MOVEMENT_TYPE_LABELS) as InventoryTransactionType[]).map((t) => (
            <option key={t} value={t}>{MOVEMENT_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={selectCls + ' lg:min-w-52'}>
          <option value="all">كل الأصناف</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs w-40" />
      </div>

      {/* Ledger */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden print:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">المخزن</th>
                <th className="py-3.5 px-4">الصنف</th>
                <th className="py-3.5 px-4">نوع الحركة</th>
                <th className="py-3.5 px-4">الكمية</th>
                <th className="py-3.5 px-4">الوحدة</th>
                <th className="py-3.5 px-4">التكلفة</th>
                <th className="py-3.5 px-4">الرصيد بعد الحركة</th>
                <th className="py-3.5 px-4">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">جاري تحميل الحركات...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">لا توجد حركات مطابقة للفلاتر المحددة.</td></tr>
              ) : (
                filtered.map((t) => {
                  const isInbound = t.base_quantity >= 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDateTime(t.created_at)}</td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{warehouseName(t.warehouse_id)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{productName(t.product_id)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${TYPE_STYLES[t.transaction_type] || TYPE_STYLES.damaged}`}>
                          {MOVEMENT_TYPE_LABELS[t.transaction_type] || t.transaction_type}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-black ${isInbound ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isInbound ? '+' : ''}{formatNumber(t.base_quantity)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{unitSymbol(t.unit_id)}</td>
                      <td className="py-3 px-4">{formatNumber(t.unit_cost)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">{formatNumber(t.balance_after)}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-48 truncate">{t.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

export default function InventoryReportPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InventoryReportContent />
    </Suspense>
  );
}