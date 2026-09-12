'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { InventoryRepository } from '@/modules/inventory/inventory_repository';
import { formatNumber } from '@/lib/format';
import type { Product, ProductCategory, StockLevel, Unit, Warehouse } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

function ValuationContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { db } = await import('@/core/db/app_database');
      try {
        const [prods, whs, cats, unts, levels] = await Promise.all([
          ProductRepository.getAll(orgId),
          InventoryRepository.getWarehouses(orgId),
          ProductRepository.getCategories(orgId),
          ProductRepository.getAllUnits(orgId),
          db.stock_levels.where('org_id').equals(orgId).toArray(),
        ]);
        const umap: Record<string, Unit> = {};
        for (const u of unts) umap[u.id] = u;
        setProducts(prods.filter((p) => p.item_type === 'storable'));
        setWarehouses(whs);
        setCategories(cats.filter((c) => c.is_active));
        setUnitsById(umap);
        setStockLevels(levels);
      } catch (err) {
        console.error('Load valuation error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    Promise.resolve().then(load);
  }, [orgId]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const productById = new Map(products.map((p) => [p.id, p]));
    return stockLevels
      .map((lvl) => ({ level: lvl, product: productById.get(lvl.product_id) }))
      .filter(
        (r): r is { level: StockLevel; product: Product } =>
          !!r.product && r.level.quantity !== 0
      )
      .filter(({ level, product }) => {
        if (warehouseFilter !== 'all' && level.warehouse_id !== warehouseFilter) return false;
        if (categoryFilter !== 'all' && product.category_id !== categoryFilter) return false;
        if (q && !product.name.toLowerCase().includes(q) && !product.sku.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'ar'));
  }, [stockLevels, products, warehouseFilter, categoryFilter, searchQuery]);

  const totals = useMemo(() => {
    let value = 0;
    let qty = 0;
    const warehouses = new Set<string>();
    const byCategory: Record<string, number> = {};
    for (const { level, product } of rows) {
      const v = level.quantity * (product.purchase_price || 0);
      value += v;
      qty += Math.abs(level.quantity);
      warehouses.add(level.warehouse_id);
      const cat = product.category_id || '';
      byCategory[cat] = (byCategory[cat] || 0) + v;
    }
    return { value, qty, warehouseCount: warehouses.size, byCategory };
  }, [rows]);

  const catName = (id?: string | null) => categories.find((c) => c.id === id)?.name || 'بدون فئة';
  const warehouseName = (id?: string) => warehouses.find((w) => w.id === id)?.name || id?.slice(0, 8) || '—';
  const unitSymbol = (id?: string) => (id ? unitsById[id]?.symbol : '') || '';

  return (
    <AppShell
      title="تقييم المخزون"
      subtitle="قيمة الأرصدة الحالية بالتكلفة (purchase price) لكل مخزن وصنف وفئة — قابل للطباعة"
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
          <span className="text-xs font-bold text-slate-400">قيمة المخزون الإجمالية</span>
          <div className="text-xl font-black text-[#558b2f] mt-1">{formatNumber(totals.value)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">إجمالي الكميات</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatNumber(totals.qty)}</div>
        </div>
        <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">عدد المخازن</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatNumber(totals.warehouseCount)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 flex-wrap items-end bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className={selectCls}>
          <option value="all">كل المخازن</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
          <option value="all">كل الفئات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالاسم أو الكود..."
          className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f] lg:w-52"
        />
        <div className="flex items-center gap-2 lg:mr-auto">
          <span className="text-[11px] font-bold text-slate-400">حسب الفئة:</span>
          {Object.entries(totals.byCategory).map(([catId, v]) => (
            <span key={catId || 'none'} className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              {catName(catId)} {formatNumber(v)}
            </span>
          ))}
        </div>
      </div>

      {/* Valuation table */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden print:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">الصنف</th>
                <th className="py-3.5 px-4">الكود</th>
                <th className="py-3.5 px-4">الفئة</th>
                <th className="py-3.5 px-4">المخزن</th>
                <th className="py-3.5 px-4">الرصيد</th>
                <th className="py-3.5 px-4">الوحدة</th>
                <th className="py-3.5 px-4">تكلفة الوحدة</th>
                <th className="py-3.5 px-4">القيمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">جاري تحميل الأرصدة...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">لا توجد أرصدة مطابقة للفلاتر المحددة.</td></tr>
              ) : (
                rows.map(({ level, product }) => (
                  <tr key={level.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{product.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{product.sku}</td>
                    <td className="py-3 px-4">{catName(product.category_id)}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{warehouseName(level.warehouse_id)}</td>
                    <td className="py-3 px-4 font-black">{formatNumber(level.quantity)}</td>
                    <td className="py-3 px-4 text-slate-500">{unitSymbol(product.base_unit_id)}</td>
                    <td className="py-3 px-4">{formatNumber(product.purchase_price || 0)}</td>
                    <td className="py-3 px-4 font-black text-[#558b2f]">{formatNumber(level.quantity * (product.purchase_price || 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-black text-sm">
                  <td colSpan={7} className="py-3 px-4 text-slate-700 dark:text-slate-200">الإجمالي</td>
                  <td className="py-3 px-4 text-[#558b2f]">{formatNumber(totals.value)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </AppShell>
  );
}

export default function ValuationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ValuationContent />
    </Suspense>
  );
}