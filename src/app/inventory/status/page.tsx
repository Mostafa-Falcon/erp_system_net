'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { InventoryRepository } from '@/modules/inventory/inventory_repository';
import { formatNumber } from '@/lib/format';
import type { Product, ProductBatch, StockLevel, Unit, Warehouse, ItemType } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

type StockRow = {
  product: Product;
  level: StockLevel | undefined;
  batches: ProductBatch[];
};

function InventoryStatusContent() {
  const searchParams = useSearchParams();
  const autoAdjust = searchParams.get('action') === 'adjust';
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(autoAdjust);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Open stock form
  const [osQty, setOsQty] = useState('');
  const [osUnitId, setOsUnitId] = useState('');
  const [osCost, setOsCost] = useState('0');
  const [osBatch, setOsBatch] = useState('');
  const [osExpiry, setOsExpiry] = useState('');
  const [osNotes, setOsNotes] = useState('');
  // Adjust form
  const [adjQty, setAdjQty] = useState('');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjUnitId, setAdjUnitId] = useState('');

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [prods, whs, unts, levels, allBatches] = await Promise.all([
        ProductRepository.getAll(orgId),
        db.warehouses.where('org_id').equals(orgId).and((w) => w.is_active).toArray(),
        ProductRepository.getAllUnits(orgId),
        db.stock_levels.where('org_id').equals(orgId).toArray(),
        db.product_batches.toArray(),
      ]);
      const umap: Record<string, Unit> = {};
      for (const u of unts) umap[u.id] = u;

      setProducts(prods);
      setWarehouses(whs);
      setUnitsById(umap);
      setStockLevels(levels);
      setBatches(allBatches);
      if (whs.length > 0) {
        setSelectedWarehouse((prev) => prev || whs[0].id);
      }
    } catch (err) {
      console.error('Load inventory status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const rows: StockRow[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products
      .filter((p) => {
        if (!selectedWarehouse && p.item_type !== 'service') return true;
        if (typeFilter !== 'all' && p.item_type !== typeFilter) return false;
        if (q) {
          const nameMatch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
          const batchMatch = batches.some(
            (b) =>
              b.product_id === p.id &&
              (!selectedWarehouse || b.warehouse_id === selectedWarehouse) &&
              b.batch_number.toLowerCase().includes(q)
          );
          if (!nameMatch && !batchMatch) return false;
        }
        return true;
      })
      .map((p) => {
        const level = stockLevels.find((s) => s.product_id === p.id && s.warehouse_id === selectedWarehouse);
        const batchList = selectedWarehouse
          ? batches.filter((b) => b.product_id === p.id && b.warehouse_id === selectedWarehouse)
          : batches.filter((b) => b.product_id === p.id);
        return { product: p, level, batches: batchList };
      })
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'ar'));
  }, [products, stockLevels, batches, selectedWarehouse, searchQuery, typeFilter]);

  const totals = useMemo(() => {
    const effectiveLevels = selectedWarehouse ? stockLevels.filter((s) => s.warehouse_id === selectedWarehouse) : stockLevels;
    const totalQty = effectiveLevels.reduce((a, s) => a + s.quantity, 0);
    const storableActive = products.filter((p) => p.is_active && p.item_type === 'storable');
    const low = storableActive.filter((p) => {
      const qty = (selectedWarehouse ? stockLevels.find((s) => s.warehouse_id === selectedWarehouse && s.product_id === p.id)?.quantity : stockLevels.filter((s) => s.product_id === p.id).reduce((a, s) => a + s.quantity, 0)) || 0;
      return qty <= p.min_stock_alert;
    });
    const out = storableActive.filter((p) => {
      const qty = (selectedWarehouse ? stockLevels.find((s) => s.warehouse_id === selectedWarehouse && s.product_id === p.id)?.quantity : stockLevels.filter((s) => s.product_id === p.id).reduce((a, s) => a + s.quantity, 0)) || 0;
      return qty <= 0;
    });
    return { totalQty, lowCount: low.length, outCount: out.length };
  }, [stockLevels, products, selectedWarehouse]);

  const activeWarehouse = warehouses.find((w) => w.id === selectedWarehouse);

  const openStockModal = (p: Product) => {
    setModalProduct(p);
    setFormError('');
    setOsQty('');
    setOsUnitId(p.base_unit_id);
    setOsCost(String(p.purchase_price || 0));
    setOsBatch(p.tracks_batch ? '' : '');
    setOsExpiry('');
    setOsNotes('');
    setOpenModal(true);
  };

  const openAdjustModal = (p: Product) => {
    setModalProduct(p);
    setFormError('');
    setAdjQty('');
    setAdjNotes('');
    setAdjUnitId(p.base_unit_id);
    setAdjustModal(true);
  };

  const handleSubmitOpen = async () => {
    if (!modalProduct || !currentUser) return;
    setFormError('');
    setIsSaving(true);
    try {
      if (modalProduct.tracks_batch && !osBatch.trim()) {
        setFormError('رقم الدفعة مطلوب لأن الصنف يتتبّع الدفعات.');
        return;
      }
      const res = await InventoryRepository.openStock({
        orgId,
        warehouseId: selectedWarehouse,
        productId: modalProduct.id,
        quantity: Number(osQty),
        unitId: osUnitId,
        conversionFactor: 1,
        unitCost: Number(osCost) || 0,
        batchNumber: osBatch.trim() || undefined,
        expiryDate: osExpiry || null,
        notes: osNotes.trim() || undefined,
        userId: currentUser.id,
      });
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ.');
        return;
      }
      setOpenModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'حدث خطأ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitAdjust = async () => {
    if (!modalProduct || !currentUser) return;
    setFormError('');
    setIsSaving(true);
    try {
      const res = await InventoryRepository.adjustStock({
        orgId,
        warehouseId: selectedWarehouse,
        productId: modalProduct.id,
        quantity: Number(adjQty),
        unitId: adjUnitId,
        conversionFactor: 1,
        unitCost: modalProduct.purchase_price || 0,
        notes: adjNotes.trim() || (Number(adjQty) > 0 ? 'تسوية زيادة' : 'تسوية نقص'),
        userId: currentUser.id,
      });
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ.');
        return;
      }
      setAdjustModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'حدث خطأ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      title="حالة المخزون"
      subtitle="أرصدة الأصناف والمخازن — رصيد افتتاحي وتسويات مخزنية وعزل بيانات كل فرع بمخازنه"
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setModalProduct(null);
              setFormError('');
              setOsQty('');
              setOsUnitId('');
              setOsCost('0');
              setOsBatch('');
              setOsExpiry('');
              setOsNotes('');
              setOpenModal(true);
            }}
            className="h-10 px-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-2"
          >
            <Icons.Inbox /> رصيد افتتاحي
          </Button>
          <Button
            onClick={() => {
              setModalProduct(null);
              setFormError('');
              setAdjQty('');
              setAdjNotes('');
              setAdjustModal(true);
            }}
            className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <Icons.ClipboardList /> تسوية مخزنية
          </Button>
        </div>
      }
    >
      {/* Warehouse selector + KPIs */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Icons.Warehouse />
          <span className="text-xs font-black text-slate-500 dark:text-slate-400">المخزن:</span>
          {warehouses.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWarehouse(w.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedWarehouse === w.id
                  ? 'bg-[#558b2f] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
            إجمالي الرصيد: {formatNumber(totals.totalQty)}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-200 dark:border-amber-800">
            منخفض: {totals.lowCount}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-black border border-red-200 dark:border-red-800">
            نفد: {totals.outCount}
          </span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="بحث برقم الصنف أو اسمه..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | ItemType)} className={selectCls}>
          <option value="all">كل الأنواع</option>
          <option value="storable">بضاعة</option>
          <option value="service">خدمات</option>
          <option value="composite">مجمع</option>
        </select>
      </div>

      {/* Stock table */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">الصنف</th>
                <th className="py-3.5 px-4">الرصيد الحالي</th>
                <th className="py-3.5 px-4">محجوز</th>
                <th className="py-3.5 px-4">متاح</th>
                <th className="py-3.5 px-4">أقل حد</th>
                <th className="py-3.5 px-4">الدفعات</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">جاري تحميل أرصدة المخزون...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    لا توجد أصناف في {activeWarehouse?.name || 'المخزن المحدد'}.
                  </td>
                </tr>
              ) : (
                rows.map(({ product: p, level, batches: batchList }) => {
                  const qty = selectedWarehouse ? level?.quantity ?? 0 : stockLevels.filter((s) => s.product_id === p.id).reduce((a, s) => a + s.quantity, 0);
                  const reserved = selectedWarehouse ? level?.reserved_quantity ?? 0 : 0;
                  const available = qty - reserved;
                  const status = p.item_type === 'service' ? null : qty <= 0 ? 'out' : qty <= p.min_stock_alert ? 'low' : 'ok';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{formatNumber(qty)}</td>
                      <td className="py-3 px-4">{formatNumber(reserved)}</td>
                      <td className="py-3 px-4 font-bold text-[#558b2f]">{formatNumber(available)}</td>
                      <td className="py-3 px-4 text-slate-500">{p.item_type === 'storable' ? formatNumber(p.min_stock_alert) : '—'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.item_type !== 'storable'
                          ? '—'
                          : p.tracks_batch
                            ? batchList.length > 0
                              ? `${batchList.length} دفعة (${formatNumber(batchList.reduce((a, b) => a + b.current_quantity, 0))})`
                              : 'بدون دفعات'
                            : 'غير متتبع'}
                      </td>
                      <td className="py-3 px-4">
                        {status === null && <span className="text-slate-300 text-[11px]">خدمة</span>}
                        {status === 'out' && <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">نفد</span>}
                        {status === 'low' && <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">منخفض</span>}
                        {status === 'ok' && <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">متوفر</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openStockModal(p)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="رصيد افتتاحي"
                          >
                            <Icons.Inbox />
                          </button>
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#558b2f]/10 hover:text-[#558b2f] transition-colors cursor-pointer"
                            title="تسوية"
                          >
                            <Icons.ClipboardList />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opening stock modal */}
      {openModal && (
        <Modal title="رصيد افتتاحي" onClose={() => setOpenModal(false)}>
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الصنف</span>
              <div className="h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center text-xs font-black text-slate-900 dark:text-white">
                {modalProduct ? (
                  <span>{modalProduct.name} <span className="text-slate-400 font-mono">({modalProduct.sku})</span></span>
                ) : (
                  'اختر التصنيف ثم اختر الصنف من الجدول، أو استخدم الزر أعلاه'
                )}
              </div>
            </div>

            {!modalProduct && (
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اختر صنفاً</span>
                <select
                  value=""
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) openStockModal(p);
                  }}
                  className={selectCls + ' w-full'}
                >
                  <option value="">— اختر —</option>
                  {products.filter((p) => p.item_type === 'storable').map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الكمية *</span>
                <Input type="number" min={0} step="any" required value={osQty} onChange={(e) => setOsQty(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الوحدة</span>
                <select value={osUnitId} onChange={(e) => setOsUnitId(e.target.value)} className={selectCls + ' w-full'}>
                  {modalProduct && unitsById[modalProduct.base_unit_id] && (
                    <option value={modalProduct.base_unit_id}>{unitsById[modalProduct.base_unit_id].name}</option>
                  )}
                  {Object.values(unitsById).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تكلفة الوحدة</span>
              <Input type="number" min={0} step="0.01" value={osCost} onChange={(e) => setOsCost(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" />
            </div>

            {modalProduct?.tracks_batch && (
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الدفعة / الرتلة *</span>
                <Input type="text" value={osBatch} onChange={(e) => setOsBatch(e.target.value)} placeholder="مثال LOT-2026-01" className="h-10 bg-slate-50 dark:bg-slate-900 text-sm font-mono" />
              </div>
            )}

            {modalProduct?.tracks_expiry && (
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ الصلاحية</span>
                <Input type="date" value={osExpiry} onChange={(e) => setOsExpiry(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" />
              </div>
            )}

            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</span>
              <Input type="text" value={osNotes} onChange={(e) => setOsNotes(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" />
            </div>

            {formError && <ErrorBanner msg={formError} />}
            <FooterButtons
              saving={isSaving}
              savingLabel="جاري التسجيل..."
              submitLabel="تسجيل الرصيد الافتتاحي"
              onCancel={() => setOpenModal(false)}
              onSubmit={handleSubmitOpen}
            />
          </div>
        </Modal>
      )}

      {/* Adjustment modal */}
      {adjustModal && (
        <Modal title="تسوية مخزنية" onClose={() => setAdjustModal(false)}>
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الصنف</span>
              {modalProduct ? (
                <div className="h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center text-xs font-black text-slate-900 dark:text-white">
                  {modalProduct.name}
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) openAdjustModal(p);
                  }}
                  className={selectCls + ' w-full'}
                >
                  <option value="">— اختر صنفاً —</option>
                  {products.filter((p) => p.item_type === 'storable').map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الكمية (+ زيادة / - نقص) *
                </span>
                <Input type="number" step="any" required value={adjQty} onChange={(e) => setAdjQty(e.target.value)} placeholder="مثال 5 أو -3" className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الوحدة</span>
                <select value={adjUnitId} onChange={(e) => setAdjUnitId(e.target.value)} className={selectCls + ' w-full'}>
                  {modalProduct && unitsById[modalProduct.base_unit_id] && (
                    <option value={modalProduct.base_unit_id}>{unitsById[modalProduct.base_unit_id].name}</option>
                  )}
                  {Object.values(unitsById).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سبب التسوية</span>
              <Input type="text" value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} placeholder="جرد / توالف / تصحيح قيد..." className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" />
            </div>

            {formError && <ErrorBanner msg={formError} />}
            <FooterButtons
              saving={isSaving}
              savingLabel="جاري التنفيذ..."
              submitLabel="تنفيذ التسوية"
              onCancel={() => setAdjustModal(false)}
              onSubmit={handleSubmitAdjust}
            />
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <Icons.X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
      {msg}
    </div>
  );
}

function FooterButtons({ saving, savingLabel, submitLabel, onCancel, onSubmit }: {
  saving: boolean;
  savingLabel: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      <Button type="button" variant="outline" onClick={onCancel} className="h-10 px-4 text-xs font-bold">
        إلغاء
      </Button>
      <Button
        type="button"
        disabled={saving}
        onClick={onSubmit}
        className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl shadow-xs"
      >
        {saving ? savingLabel : submitLabel}
      </Button>
    </div>
  );
}

export default function InventoryStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InventoryStatusContent />
    </Suspense>
  );
}