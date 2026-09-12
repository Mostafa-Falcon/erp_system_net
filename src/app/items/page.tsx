'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { InventoryRepository } from '@/modules/inventory/inventory_repository';
import { renderCode128Svg } from '@/lib/code128';
import { formatNumber, ITEM_TYPE_LABELS, formatDateTime, isExpired, daysToExpiry } from '@/lib/format';
import type { Product, ProductCategory, ProductBrand, Unit, Warehouse, StockLevel, ProductBatch } from '@/types';

function ItemsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [batchesByProduct, setBatchesByProduct] = useState<Record<string, ProductBatch[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  // Detail modal drive by ?id=
  const detailId = searchParams.get('id');

  const loadData = async () => {
    if (!orgId) return;
    try {
      const prods = await ProductRepository.getAll(orgId);
      const inactives = await db_products_inactive(orgId);
      const allProducts = [...prods, ...inactives.filter((p) => !prods.some((x) => x.id === p.id))];
      const [cats, brs, unts, whs, stockLevels, allBatches] = await Promise.all([
        ProductRepository.getCategories(orgId),
        ProductRepository.getBrands(orgId),
        ProductRepository.getAllUnits(orgId),
        InventoryRepository.getWarehouses(orgId),
        db_stockLevels_for_org(orgId),
        db_batches_for_org(),
      ]);

      const unitMap: Record<string, Unit> = {};
      for (const u of unts) unitMap[u.id] = u;

      const stock: Record<string, number> = {};
      const levelById: Record<string, number> = {};
      for (const s of stockLevels) {
        stock[s.product_id] = (stock[s.product_id] || 0) + s.quantity;
        levelById[`${s.warehouse_id}_${s.product_id}`] = s.quantity;
      }

      const batchMap: Record<string, ProductBatch[]> = {};
      for (const b of allBatches) {
        (batchMap[b.product_id] = batchMap[b.product_id] || []).push(b);
      }

      setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name, 'ar')));
      setCategories(cats.filter((c) => c.is_active));
      setBrands(brs);
      setUnitsById(unitMap);
      setWarehouses(whs);
      setStockMap(stock);
      setStockLevels(stockLevels);
      setBatchesByProduct(batchMap);
    } catch (err) {
      console.error('Load catalog error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.is_active && !showInactive) return false;
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      if (brandFilter !== 'all' && p.brand_id !== brandFilter) return false;
      if (typeFilter !== 'all' && p.item_type !== typeFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, typeFilter, showInactive]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.is_active);
    const lowStock = active.filter((p) => p.item_type === 'storable' && (stockMap[p.id] || 0) <= p.min_stock_alert);
    const outOfStock = active.filter((p) => p.item_type === 'storable' && (stockMap[p.id] || 0) <= 0);
    return {
      total: products.length,
      active: active.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      stockValue: Object.entries(stockMap).reduce((acc, [pid, qty]) => {
        const p = products.find((x) => x.id === pid);
        return acc + qty * (p?.purchase_price || 0);
      }, 0),
    };
  }, [products, stockMap]);

  const catName = (id?: string | null) => categories.find((c) => c.id === id)?.name || '—';
  const unitSymbol = (id?: string | null) => (id ? unitsById[id]?.symbol : undefined) || '—';

  const detailProduct = detailId ? products.find((p) => p.id === detailId) : undefined;

  const stockBadge = (p: Product) => {
    const stock = stockMap[p.id] || 0;
    if (p.item_type !== 'storable') return null;
    if (stock <= 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">نفد المخزون</span>;
    }
    if (stock <= p.min_stock_alert) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">منخفض</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">متوفر</span>;
  };

  return (
    <AppShell
      title="دليل الأصناف"
      subtitle="إدارة الأصناف والوحدات والأسعار والباركود — لكل فرع في منشأتك مخزونه الخاص"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/items/barcode"
            className="h-10 px-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Icons.Print /> طباعة باركود
          </Link>
          <Link
            href="/items/new"
            className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
          >
            <Icons.Plus /> إضافة صنف
          </Link>
        </div>
      }
    >
      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="إجمالي الأصناف" value={formatNumber(stats.total)} color="text-slate-900 dark:text-white" icon={<Icons.Boxes />} bg="bg-blue-50 dark:bg-blue-950/50 text-blue-600" />
        <StatCard label="أصناف نشطة" value={formatNumber(stats.active)} color="text-emerald-600" icon={<Icons.Check />} bg="bg-emerald-50 dark:bg-emerald-950/50 text-[#16a34a]" />
        <StatCard label="أصناف منخفضة" value={formatNumber(stats.lowStock)} color="text-amber-600" icon={<Icons.AlertTriangle />} bg="bg-amber-50 dark:bg-amber-950/50 text-amber-600" />
        <StatCard label="نفد المخزون" value={formatNumber(stats.outOfStock)} color="text-red-600" icon={<Icons.X />} bg="bg-red-50 dark:bg-red-950/50 text-red-600" />
        <StatCard label="قيمة المخزون" value={formatNumber(stats.stockValue)} color="text-slate-900 dark:text-white" icon={<Icons.CashRegister />} bg="bg-purple-50 dark:bg-purple-950/50 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="w-full lg:w-80">
          <Input
            type="text"
            placeholder="بحث بالاسم أو الكود/الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]"
          >
            <option value="all">كل العلامات</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]"
          >
            <option value="all">كل الأنواع</option>
            <option value="storable">بضاعة</option>
            <option value="service">خدمات</option>
            <option value="composite">مجمع</option>
          </select>

          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer px-2">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-[#558b2f] w-3.5 h-3.5" />
            المعطلة
          </label>
        </div>
      </div>

      {/* Catalog table */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">الصنف</th>
                <th className="py-3.5 px-4">التصنيف</th>
                <th className="py-3.5 px-4">الوحدة</th>
                <th className="py-3.5 px-4">سعر البيع</th>
                <th className="py-3.5 px-4">سعر الشراء</th>
                <th className="py-3.5 px-4">متاح بالمخزون</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">جاري تحميل دليل الأصناف...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">لا توجد أصناف مطابقة — اضغط «إضافة صنف» للبدء.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 text-slate-300 hidden xl:block">
                          <div dangerouslySetInnerHTML={{ __html: renderCode128Svg(p.sku, { moduleWidth: 0.24, height: 22 }) }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-400">{ITEM_TYPE_LABELS[p.item_type]}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{p.sku}{p.brand_id ? ` • ${brands.find((b) => b.id === p.brand_id)?.name || ''}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{catName(p.category_id)}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{unitSymbol(p.base_unit_id)}</td>
                    <td className="py-3 px-4 font-black text-[#558b2f]">{formatNumber(p.sale_price)}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatNumber(p.purchase_price)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white">{formatNumber(stockMap[p.id], p.tracks_batch ? 2 : 0)}</span>
                        {stockBadge(p)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${p.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'}`}>
                        {p.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { router.push(`/items?id=${p.id}`); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <Icons.Eye />
                        </button>
                        <Link
                          href={`/items/new?edit=${p.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#558b2f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Icons.Edit />
                        </Link>
                        <button
                          onClick={async () => {
                            await ProductRepository.setActive(p.id, !p.is_active);
                            loadData();
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title={p.is_active ? 'تعطيل' : 'تفعيل'}
                        >
                          <Icons.X />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detailProduct && (
        <ItemDetailModal
          product={detailProduct}
          unitSymbol={unitSymbol}
          catName={catName}
          warehouses={warehouses}
          stockLevels={stockLevels}
          batches={batchesByProduct[detailProduct.id] || []}
          onClose={() => router.push('/items')}
        />
      )}
    </AppShell>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
      <div>
        <span className="text-xs font-bold text-slate-400">{label}</span>
        <div className={`text-xl font-black mt-1 ${color}`}>{value}</div>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
    </div>
  );
}

function ItemDetailModal({
  product,
  unitSymbol,
  catName,
  warehouses,
  stockLevels,
  batches,
  onClose,
}: {
  product: Product;
  unitSymbol: (id?: string | null) => string;
  catName: (id?: string | null) => string;
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  batches: ProductBatch[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              {product.name}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{ITEM_TYPE_LABELS[product.item_type]}</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{product.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><Icons.X /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <InfoBox label="التصنيف" value={catName(product.category_id)} />
          <InfoBox label="الوحدة الأساسية" value={unitSymbol(product.base_unit_id)} />
          <InfoBox label="سعر البيع" value={formatNumber(product.sale_price)} accent />
          <InfoBox label="سعر الشراء" value={formatNumber(product.purchase_price)} />
          <InfoBox label="نسبة الضريبة" value={`${formatNumber(product.tax_rate)}%`} />
          <InfoBox label="أقل رصيد" value={formatNumber(product.min_stock_alert)} />
          <InfoBox label="تتبع دفعات" value={product.tracks_batch ? 'نعم' : 'لا'} />
          <InfoBox label="صلاحية" value={product.tracks_expiry ? 'نعم' : 'لا'} />
        </div>

        {product.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{product.description}</p>
        )}

        <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2">المخزون حسب المخازن</h4>
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-5">
          <table className="w-full text-right text-xs">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {warehouses.length === 0 && (
                <tr><td className="py-4 px-4 text-slate-400 text-center">لا توجد مخازن مفعّلة بعد.</td></tr>
              )}
              {warehouses.map((w) => {
                const level = stockLevels.find((s) => s.warehouse_id === w.id && s.product_id === product.id);
                return (
                  <tr key={w.id}>
                    <td className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300">{w.name}</td>
                    <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white text-left">{formatNumber(level?.quantity ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {product.tracks_batch && batches.length > 0 && (
          <>
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2">الدفعات / الأرتال</h4>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-5">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500">
                    <th className="py-2 px-4">رقم الدفعة</th>
                    <th className="py-2 px-4">المخزن</th>
                    <th className="py-2 px-4">الكمية</th>
                    <th className="py-2 px-4">الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {batches.map((b) => {
                    const expired = isExpired(b.expiry_date);
                    const soon = daysToExpiry(b.expiry_date) <= 90;
                    return (
                      <tr key={b.id}>
                        <td className="py-2.5 px-4 font-mono font-bold">{b.batch_number}</td>
                        <td className="py-2.5 px-4 text-slate-500">{warehouses.find((w) => w.id === b.warehouse_id)?.name || b.warehouse_id.slice(0, 6)}</td>
                        <td className="py-2.5 px-4 font-black">{formatNumber(b.current_quantity)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${expired ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' : soon ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                            {product.tracks_expiry ? (b.expiry_date ? formatDateTime(b.expiry_date) : 'بدون تاريخ') : (expired ? 'منتهية' : 'سارية')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">آخر تحديث: {formatDateTime(product.updated_at)}</span>
          <div className="flex items-center gap-2">
            <Link href="/items/barcode" className="h-10 px-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-2">
              <Icons.Print /> طباعة باركود
            </Link>
            <Link href={`/items/new?edit=${product.id}`} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl flex items-center gap-2">
              <Icons.Edit /> تعديل الصنف
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-2.5">
      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">{label}</span>
      <span className={`text-sm font-black ${accent ? 'text-[#558b2f]' : 'text-slate-800 dark:text-white'}`}>{value}</span>
    </div>
  );
}

// Local Dexie helpers to avoid importing db twice at module top-level in this page.
async function db_products_inactive(orgId: string) {
  const { db } = await import('@/core/db/app_database');
  return await db.products.where('org_id').equals(orgId).and((p) => !p.is_active).toArray();
}

async function db_stockLevels_for_org(orgId: string) {
  const { db } = await import('@/core/db/app_database');
  return await db.stock_levels.where('org_id').equals(orgId).toArray();
}

async function db_batches_for_org() {
  const { db } = await import('@/core/db/app_database');
  return await db.product_batches.toArray();
}

export default function ItemsCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ItemsCatalogContent />
    </Suspense>
  );
}