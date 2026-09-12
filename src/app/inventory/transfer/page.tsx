'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { StockTransferRepository, type TransferItemInput } from '@/modules/inventory/stock_transfer_repository';
import { formatNumber, formatDateTime, TRANSFER_STATUS_LABELS } from '@/lib/format';
import type { Product, ProductBatch, StockTransfer, StockTransferItem, Unit, Warehouse } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  pending: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  completed: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
};

function TransferContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [allBatches, setAllBatches] = useState<ProductBatch[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [itemsByTransfer, setItemsByTransfer] = useState<Record<string, StockTransferItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Create form
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<
    { productId: string; qty: string; unitId: string; cost: string; batchId: string }[]
  >([]);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // View modal
  const [viewId, setViewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [whs, prods, unts, batches, transList, allTransItems] = await Promise.all([
        db.warehouses.where('org_id').equals(orgId).and((w) => w.is_active).toArray(),
        db.products.where('org_id').equals(orgId).and((p) => p.is_active && p.item_type === 'storable').toArray(),
        db.units.where('org_id').equals(orgId).toArray(),
        db.product_batches.toArray(),
        StockTransferRepository.getTransfers(orgId),
        db.stock_transfer_items.toArray(),
      ]);

      const umap: Record<string, Unit> = {};
      for (const u of unts) umap[u.id] = u;

      const grouped: Record<string, StockTransferItem[]> = {};
      for (const it of allTransItems) {
        (grouped[it.transfer_id] = grouped[it.transfer_id] || []).push(it);
      }

      setWarehouses(whs);
      setProducts(prods);
      setUnitsById(umap);
      setAllBatches(batches);
      setTransfers(transList);
      setItemsByTransfer(grouped);

      if (whs.length > 0) {
        setFromWarehouse((prev) => prev || whs[0].id);
        setToWarehouse((prev) => prev || (whs[1]?.id || whs[0].id));
      }
    } catch (err) {
      console.error('Load transfers error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const batchesFor = (warehouseId: string, productId: string) =>
    allBatches
      .filter((b) => b.warehouse_id === warehouseId && b.product_id === productId && b.current_quantity > 0)
      .sort((a, b) => a.batch_number.localeCompare(b.batch_number));

  const addLine = () => {
    setLines((prev) => [...prev, { productId: '', qty: '1', unitId: '', cost: '0', batchId: '' }]);
    setFormError('');
  };

  const updateLine = (idx: number, patch: Partial<(typeof lines)[number]>) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const onProductChange = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(idx, {
      productId,
      unitId: p?.base_unit_id || '',
      cost: String(p?.purchase_price || 0),
    });
  };

  const lineProduct = (line: (typeof lines)[number]) => products.find((p) => p.id === line.productId);

  const saveTransfer = async () => {
    setFormError('');
    if (!currentUser) return;
    if (!fromWarehouse || !toWarehouse) {
      setFormError('اختر مخزن المصدر والمخزن الوجهة.');
      return;
    }
    if (fromWarehouse === toWarehouse) {
      setFormError('لا يمكن التحويل إلى نفس المخزن.');
      return;
    }
    const items: TransferItemInput[] = [];
    for (const line of lines) {
      const p = lineProduct(line);
      if (!p || !line.unitId || !(Number(line.qty) > 0)) {
        setFormError('أكمل بيانات كل الأصناف (المنتج والكمية والوحدة).');
        return;
      }
      items.push({
        productId: line.productId,
        batchId: line.batchId || null,
        unitId: line.unitId,
        conversionFactor: 1,
        quantity: Number(line.qty),
        unitCost: Number(line.cost) || 0,
      });
    }
    if (items.length === 0) {
      setFormError('أضف صنفاً واحداً على الأقل.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await StockTransferRepository.createTransfer({
        orgId,
        fromWarehouseId: fromWarehouse,
        toWarehouseId: toWarehouse,
        items,
        notes: notes.trim() || undefined,
        userId: currentUser.id,
      });
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ.');
        return;
      }
      setLines([]);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التحويل.');
    } finally {
      setIsSaving(false);
    }
  };

  const completeTransfer = async (id: string) => {
    if (!confirm('تأكيد استكمال التحويل؟ سيتم خصم الأصناف من مخزن المصدر وإضافتها لمخزن الوجهة فوراً.')) return;
    setBusyId(id);
    try {
      const res = await StockTransferRepository.completeTransfer(id);
      if (!res.success) {
        alert(res.error || 'فشل استكمال التحويل.');
      }
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'حدث خطأ.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelTransfer = async (id: string) => {
    if (!confirm('تأكيد إلغاء التحويل؟')) return;
    setBusyId(id);
    try {
      const res = await StockTransferRepository.cancelTransfer(id);
      if (!res.success) {
        alert(res.error || 'فشل الإلغاء.');
      }
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'حدث خطأ.');
    } finally {
      setBusyId(null);
    }
  };

  const totalLinesQty = useMemo(
    () => lines.reduce((a, l) => a + (Number(l.qty) || 0), 0),
    [lines]
  );

  const viewTransfer = viewId ? transfers.find((t) => t.id === viewId) : undefined;

  return (
    <AppShell
      title="تحويل مخزون"
      subtitle="نقل الأصناف بين مخازن نفس المنشأة — كل مخزن بحسابه وأرصدته المستقلة"
    >
      {/* Create transfer panel */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#558b2f]"><Icons.SwapHorizontal /></span>
            تحويل جديد
          </h3>
          <Button onClick={addLine} className="h-9 px-3 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Icons.Plus /> إضافة صنف
          </Button>
        </div>

        {formError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">من مخزن (المصدر)</span>
            <select value={fromWarehouse} onChange={(e) => setFromWarehouse(e.target.value)} className={selectCls + ' w-full'}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">إلى مخزن (الوجهة)</span>
            <select value={toWarehouse} onChange={(e) => setToWarehouse(e.target.value)} className={selectCls + ' w-full'}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</span>
            <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-sm" placeholder="سبب التحويل (اختياري)" />
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-xs font-semibold text-slate-400">
            أضف الأصناف المطلوب تحويلها باستخدام زر «إضافة صنف».
          </div>
        ) : (
          <div className="space-y-2">
            {lines.map((line, idx) => {
              const p = lineProduct(line);
              const availableBatches = p?.tracks_batch ? batchesFor(fromWarehouse, line.productId) : [];
              return (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3">
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">الصنف</span>
                    <select
                      value={line.productId}
                      onChange={(e) => onProductChange(idx, e.target.value)}
                      className={selectCls + ' w-full bg-white dark:bg-slate-800'}
                    >
                      <option value="">— اختر —</option>
                      {products.map((pr) => (
                        <option key={pr.id} value={pr.id}>{pr.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">الكمية</span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={line.qty}
                      onChange={(e) => updateLine(idx, { qty: e.target.value })}
                      className="h-9 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">الوحدة / التكلفة</span>
                    <div className="flex gap-1.5">
                      <select
                        value={line.unitId}
                        onChange={(e) => updateLine(idx, { unitId: e.target.value })}
                        className={selectCls + ' w-24 bg-white dark:bg-slate-800'}
                      >
                        {p && unitsById[p.base_unit_id] && (
                          <option value={p.base_unit_id}>{unitsById[p.base_unit_id].symbol}</option>
                        )}
                        {Object.values(unitsById).map((u) => (
                          <option key={u.id} value={u.id}>{u.symbol}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={line.cost}
                        onChange={(e) => updateLine(idx, { cost: e.target.value })}
                        className="w-16 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {p?.tracks_batch && availableBatches.length > 0 ? (
                      <div className="flex-1">
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">دفعة</span>
                        <select
                          value={line.batchId}
                          onChange={(e) => updateLine(idx, { batchId: e.target.value })}
                          className={selectCls + ' w-full bg-white dark:bg-slate-800'}
                        >
                          <option value="">أحدث دفعة</option>
                          {availableBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batch_number} (متاح {formatNumber(b.current_quantity)})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {p?.tracks_batch ? 'لا توجد دفعات متاحة في المصدر' : 'لا يتطلب دفعة'}
                      </span>
                    )}
                    <button
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer mr-2"
                    >
                      <Icons.X />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-500">
                إجمالي الكميات: <span className="font-black text-slate-900 dark:text-white">{formatNumber(totalLinesQty)}</span>
              </span>
              <Button
                onClick={saveTransfer}
                disabled={isSaving}
                className="h-10 px-6 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transfers list */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">سجل التحويلات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">التحويل</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">المصدر</th>
                <th className="py-3.5 px-4">الوجهة</th>
                <th className="py-3.5 px-4">البنود</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">جاري تحميل التحويلات...</td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">لا توجد تحويلات بعد.</td></tr>
              ) : (
                transfers.map((t) => {
                  const itemCount = (itemsByTransfer[t.id] || []).length;
                  const fromW = warehouses.find((w) => w.id === t.from_warehouse_id);
                  const toW = warehouses.find((w) => w.id === t.to_warehouse_id);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-[#558b2f]">{t.transfer_no}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDateTime(t.created_at)}</td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{fromW?.name || '—'}</td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{toW?.name || '—'}</td>
                      <td className="py-3 px-4 font-black">{itemCount} بنود</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${STATUS_STYLES[t.status] || STATUS_STYLES.draft}`}>
                          {TRANSFER_STATUS_LABELS[t.status] || t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewId(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="عرض البنود"
                          >
                            <Icons.Eye />
                          </button>
                          {(t.status === 'draft' || t.status === 'pending') && (
                            <>
                              <button
                                onClick={() => completeTransfer(t.id)}
                                disabled={busyId === t.id}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                                title="استكمال"
                              >
                                استكمال
                              </button>
                              <button
                                onClick={() => cancelTransfer(t.id)}
                                disabled={busyId === t.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                title="إلغاء"
                              >
                                <Icons.X />
                              </button>
                            </>
                          )}
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

      {/* View modal */}
      {viewTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">{viewTransfer.transfer_no}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {warehouses.find((w) => w.id === viewTransfer.from_warehouse_id)?.name} ←
                  {warehouses.find((w) => w.id === viewTransfer.to_warehouse_id)?.name} • {formatDateTime(viewTransfer.created_at)}
                </p>
              </div>
              <button onClick={() => setViewId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <Icons.X />
              </button>
            </div>

            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500">
                  <th className="py-2 px-3">الصنف</th>
                  <th className="py-2 px-3">الكمية</th>
                  <th className="py-2 px-3">التكلفة</th>
                  <th className="py-2 px-3">الإجمالي</th>
                  <th className="py-2 px-3">الدفعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(itemsByTransfer[viewTransfer.id] || []).map((it) => {
                  const p = products.find((x) => x.id === it.product_id);
                  const batch = it.batch_id ? allBatches.find((b) => b.id === it.batch_id) : undefined;
                  return (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p?.name || it.product_id}</td>
                      <td className="py-2.5 px-3 font-black">{formatNumber(it.quantity)}</td>
                      <td className="py-2.5 px-3">{formatNumber(it.unit_cost)}</td>
                      <td className="py-2.5 px-3 font-black text-[#558b2f]">{formatNumber(it.total_cost)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{batch?.batch_number || (p?.tracks_batch ? 'أحدث دفعة' : '—')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {viewTransfer.notes && (
              <p className="mt-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">{viewTransfer.notes}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black ${STATUS_STYLES[viewTransfer.status]}`}>
                {TRANSFER_STATUS_LABELS[viewTransfer.status] || viewTransfer.status}
              </span>
              {(viewTransfer.status === 'draft' || viewTransfer.status === 'pending') && (
                <Button
                  onClick={async () => {
                    setViewId(null);
                    await completeTransfer(viewTransfer.id);
                  }}
                  className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl"
                >
                  استكمال التحويل
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TransferContent />
    </Suspense>
  );
}