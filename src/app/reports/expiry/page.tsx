'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { formatNumber, isExpired, daysToExpiry, formatDateTime } from '@/lib/format';
import type { Product, ProductBatch, Unit, Warehouse } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

type ExpiryStatus = 'expired' | 'soon30' | 'soon90' | 'valid';

function statusOf(batch: ProductBatch): { status: ExpiryStatus; days?: number } {
  if (!batch.expiry_date) return { status: 'valid' };
  const expired = isExpired(batch.expiry_date);
  if (expired) return { status: 'expired' };
  const days = daysToExpiry(batch.expiry_date);
  if (days <= 30) return { status: 'soon30', days };
  if (days <= 90) return { status: 'soon90', days };
  return { status: 'valid', days };
}

const STATUS_STYLES: Record<ExpiryStatus, string> = {
  expired: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  soon30: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  soon90: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  valid: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

const STATUS_LABELS: Record<ExpiryStatus, string> = {
  expired: 'منتهية الصلاحية',
  soon30: 'تنتهي خلال 30 يوم',
  soon90: 'تنتهي خلال 90 يوم',
  valid: 'سارية',
};

function ExpiryReportContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpiryStatus>('all');
  const [productFilter, setProductFilter] = useState('all');

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { db } = await import('@/core/db/app_database');
      try {
        const prods = await ProductRepository.getAll(orgId);
        const orgProductIds = new Set(prods.map((p) => p.id));
        const [whs, unts, allBatches] = await Promise.all([
          db.warehouses.where('org_id').equals(orgId).toArray(),
          ProductRepository.getAllUnits(orgId),
          db.product_batches.toArray(),
        ]);
        const orgBatches = allBatches.filter((b) => orgProductIds.has(b.product_id));
        const umap: Record<string, Unit> = {};
        for (const u of unts) umap[u.id] = u;
        setProducts(prods);
        setWarehouses(whs);
        setUnitsById(umap);
        setBatches(orgBatches);
      } catch (err) {
        console.error('Load expiry report error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    Promise.resolve().then(load);
  }, [orgId]);

  const rows = useMemo(() => {
    return batches
      .map((b) => ({ batch: b, info: statusOf(b) }))
      .filter(({ batch, info }) => {
        if (warehouseFilter !== 'all' && batch.warehouse_id !== warehouseFilter) return false;
        if (statusFilter !== 'all' && info.status !== statusFilter) return false;
        if (productFilter !== 'all' && batch.product_id !== productFilter) return false;
        return true;
      })
      .sort((a, b) => (a.batch.expiry_date || '').localeCompare(b.batch.expiry_date || ''));
  }, [batches, warehouseFilter, statusFilter, productFilter]);

  const totals = useMemo(() => {
    const counts: Record<ExpiryStatus, number> = { expired: 0, soon30: 0, soon90: 0, valid: 0 };
    let value = 0;
    for (const r of rows) {
      counts[r.info.status] += 1;
      value += r.batch.current_quantity * (r.batch.purchase_price || 0);
    }
    return { ...counts, value };
  }, [rows]);

  const warehouseName = (id?: string) => warehouses.find((w) => w.id === id)?.name || id?.slice(0, 8) || '—';
  const unitSymbol = (id?: string) => (id ? unitsById[id]?.symbol : '') || '';

  return (
    <AppShell
      title="تقرير الصلاحيات"
      subtitle="رصد دفعات الأصناف منتهية الصلاحية أو القريبة من الانتهاء عبر كل المخازن — قابل للطباعة"
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">منتهية</span>
          <div className="text-xl font-black text-red-600 mt-1">{formatNumber(totals.expired)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">خلال 30 يوم</span>
          <div className="text-xl font-black text-amber-600 mt-1">{formatNumber(totals.soon30)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">خلال 90 يوم</span>
          <div className="text-xl font-black text-orange-600 mt-1">{formatNumber(totals.soon90)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">سارية</span>
          <div className="text-xl font-black text-emerald-600 mt-1">{formatNumber(totals.valid)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">القيمة المعروضة</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatNumber(totals.value)}</div>
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ExpiryStatus)} className={selectCls}>
          <option value="all">كل الحالات</option>
          {(Object.keys(STATUS_LABELS) as ExpiryStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={selectCls + ' lg:min-w-52'}>
          <option value="all">كل الأصناف</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Batches table */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden print:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">الصنف</th>
                <th className="py-3.5 px-4">رقم الدفعة</th>
                <th className="py-3.5 px-4">المخزن</th>
                <th className="py-3.5 px-4">تاريخ الانتهاء</th>
                <th className="py-3.5 px-4">المتبقي</th>
                <th className="py-3.5 px-4">الرصيد</th>
                <th className="py-3.5 px-4">الوحدة</th>
                <th className="py-3.5 px-4">القيمة</th>
                <th className="py-3.5 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">جاري تحميل الدفعات...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">لا توجد دفعات مطابقة للفلاتر المحددة.</td></tr>
              ) : (
                rows.map(({ batch, info }) => {
                  const p = products.find((x) => x.id === batch.product_id);
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p?.name || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">{batch.batch_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{warehouseName(batch.warehouse_id)}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{batch.expiry_date ? formatDateTime(batch.expiry_date) : '—'}</td>
                      <td className="py-3 px-4 font-black">
                        {info.days !== undefined ? (
                          <span className={info.status === 'valid' ? 'text-emerald-600' : 'text-amber-600'}>
                            {formatNumber(info.days)} يوم
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-800 dark:text-slate-100">{formatNumber(batch.current_quantity)}</td>
                      <td className="py-3 px-4 text-slate-500">{unitSymbol(p?.base_unit_id)}</td>
                      <td className="py-3 px-4 font-bold">{formatNumber(batch.current_quantity * (batch.purchase_price || 0))}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${STATUS_STYLES[info.status]}`}>
                          {STATUS_LABELS[info.status]}
                        </span>
                      </td>
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

export default function ExpiryReportPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExpiryReportContent />
    </Suspense>
  );
}