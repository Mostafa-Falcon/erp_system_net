'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { PurchasesRepository } from '@/modules/purchases/purchases_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import type { Contact, Product, PurchaseInvoice, PurchaseInvoiceItem, Treasury, Unit, Warehouse } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  credit: 'آجل',
  split: 'سداد جزئي',
};

function InvoicesContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const router = useRouter();

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [itemsByInvoice, setItemsByInvoice] = useState<Record<string, PurchaseInvoiceItem[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [invList, allItems, prods, unts, tres, whs, sups] = await Promise.all([
        PurchasesRepository.getPurchaseInvoices(orgId),
        db.purchase_invoice_items.toArray(),
        db.products.where('org_id').equals(orgId).toArray(),
        db.units.where('org_id').equals(orgId).toArray(),
        db.treasuries.where('org_id').equals(orgId).toArray(),
        db.warehouses.where('org_id').equals(orgId).toArray(),
        db.contacts.where('org_id').equals(orgId).and((c) => c.is_active).toArray(),
      ]);

      const grouped: Record<string, PurchaseInvoiceItem[]> = {};
      for (const it of allItems) {
        (grouped[it.invoice_id] = grouped[it.invoice_id] || []).push(it);
      }

      setInvoices(invList);
      setItemsByInvoice(grouped);
      setProducts(prods);
      setUnits(unts);
      setTreasuries(tres);
      setWarehouses(whs);
      setSuppliers(sups);
    } catch (err) {
      console.error('Load invoices error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const nameOf = (map: { id: string; name: string }[], id?: string | null) =>
    (id && map.find((x) => x.id === id)?.name) || '—';

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (supplierFilter && inv.supplier_id !== supplierFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const supplierName = (suppliers.find((x) => x.id === inv.supplier_id)?.name || '—').toLowerCase();
      return (
        inv.system_invoice_number.toLowerCase().includes(q) ||
        inv.invoice_number.toLowerCase().includes(q) ||
        supplierName.includes(q)
      );
    });
  }, [invoices, search, supplierFilter, suppliers]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (a, inv) => ({
        total: a.total + inv.total,
        remaining: a.remaining + inv.remaining_amount,
        paid: a.paid + inv.paid_amount,
        count: a.count + 1,
      }),
      { total: 0, remaining: 0, paid: 0, count: 0 }
    );
  }, [filtered]);

  const viewInvoice = viewId ? invoices.find((i) => i.id === viewId) : undefined;
  const viewItems = viewId ? itemsByInvoice[viewId] || [] : [];

  const openReturn = async (invoice: PurchaseInvoice) => {
    if (!confirm(`إنشاء مرتجع من فاتورة «${invoice.system_invoice_number}»؟ ستُجهّز أصنافها للمرتجع.`)) return;
    router.push(`/purchases/returns/new?invoice=${invoice.id}&supplier=${invoice.supplier_id}&warehouse=${invoice.warehouse_id}`);
  };

  return (
    <AppShell title="فواتير المشتريات" subtitle="سجل مشتريات المنشأة — يرتبط بمورد وجهات التواصل ويحدّث المخزون والذمم">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="عدد الفواتير" value={String(totals.count)} accent="#558b2f" />
          <Kpi label="إجمالي المشتريات" value={formatNumber(totals.total)} accent="#0f766e" />
          <Kpi label="المسدد" value={formatNumber(totals.paid)} accent="#2563eb" />
          <Kpi label="مستحق للموردين" value={formatNumber(totals.remaining)} accent="#d97706" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-56">
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالرقم أو المورد..."
                  className="h-10 bg-slate-50 dark:bg-slate-900 text-xs pr-9"
                  icon={<Icons.Search />}
                />
              </div>
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className={selectCls + ' w-44'}>
                <option value="">كل الموردين</option>
                {suppliers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => router.push('/purchases/invoices/new')} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Icons.Plus /> فاتورة مشتريات جديدة
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">جارٍ تحميل الفواتير...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icons.Receipt /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد فواتير مشتريات بعد.</p>
              <p className="mt-1 text-xs text-slate-400">ابدأ بتسجيل أول فاتورة من زر «فاتورة مشتريات جديدة».</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                    <th className="py-2.5 pr-3">الرقم</th>
                    <th className="py-2.5">المورد</th>
                    <th className="py-2.5">المخزن</th>
                    <th className="py-2.5">التاريخ</th>
                    <th className="py-2.5">الدفع</th>
                    <th className="py-2.5 pl-3">الإجمالي</th>
                    <th className="py-2.5 pl-3">المتبقي</th>
                    <th className="py-2.5 pl-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pr-3">
                        <span className="text-[#558b2f] font-black">{inv.system_invoice_number}</span>
                        <div className="text-[10px] text-slate-400 font-semibold">{inv.invoice_number || 'بدون رقم مورد'}</div>
                      </td>
                      <td className="py-3">{nameOf(suppliers, inv.supplier_id)}</td>
                      <td className="py-3 text-[11px]">{nameOf(warehouses, inv.warehouse_id)}</td>
                      <td className="py-3 text-[11px]">{formatDateTime(inv.invoice_date)}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {PAYMENT_LABELS[inv.payment_type] || inv.payment_type}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-[#558b2f] font-black">{formatNumber(inv.total)}</td>
                      <td className="py-3 pl-3">{inv.remaining_amount > 0 ? <span className="text-amber-600 dark:text-amber-400 font-black">{formatNumber(inv.remaining_amount)}</span> : <span className="text-emerald-600 dark:text-emerald-400">مُسددة</span>}</td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewId(inv.id)} title="عرض" className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-[#558b2f]"><Icons.Eye /></button>
                          <button onClick={() => openReturn(inv)} title="مرتجع" className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-red-500"><Icons.ReturnArrow /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewId(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131b2e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#558b2f]"><Icons.Receipt /></span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{viewInvoice.system_invoice_number}</h3>
              </div>
              <button onClick={() => setViewId(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><Icons.X /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Info label="المورد" value={nameOf(suppliers, viewInvoice.supplier_id)} />
              <Info label="المخزن" value={nameOf(warehouses, viewInvoice.warehouse_id)} />
              <Info label="رقم فاتورة المورد" value={viewInvoice.invoice_number || '—'} />
              <Info label="التاريخ" value={formatDateTime(viewInvoice.invoice_date)} />
              <Info label="طريقة الدفع" value={PAYMENT_LABELS[viewInvoice.payment_type] || viewInvoice.payment_type} />
              <Info label="الخزينة" value={nameOf(treasuries, viewInvoice.treasury_id)} />
            </div>

            <table className="w-full text-right mb-4">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                  <th className="py-2">الصنف</th>
                  <th className="py-2">الوحدة</th>
                  <th className="py-2">الدفعة</th>
                  <th className="py-2">الكمية</th>
                  <th className="py-2">التكلفة</th>
                  <th className="py-2 pl-2">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {viewItems.map((it) => {
                  const un = units.find((u) => u.id === it.unit_id);
                  return (
                    <tr key={it.id} className="border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <td className="py-2.5">{nameOf(products, it.product_id)}</td>
                      <td className="py-2.5 text-[11px]">{un?.symbol || '—'}</td>
                      <td className="py-2.5 text-[11px]">{it.batch_number || '—'}</td>
                      <td className="py-2.5">{formatNumber(it.quantity)}</td>
                      <td className="py-2.5">{formatNumber(it.unit_cost)}</td>
                      <td className="py-2.5 pl-2 text-[#558b2f] font-black">{formatNumber(it.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end text-xs font-bold text-slate-600 dark:text-slate-300 space-x-6 space-x-reverse">
              <div>
                <span className="text-slate-400">الإجمالي:</span>{' '}
                <span className="font-black text-slate-900 dark:text-white">{formatNumber(viewInvoice.total)}</span>
              </div>
              <div>
                <span className="text-slate-400">المسدد:</span>{' '}
                <span className="font-black text-emerald-600 dark:text-emerald-400">{formatNumber(viewInvoice.paid_amount)}</span>
              </div>
              <div>
                <span className="text-slate-400">المتبقي:</span>{' '}
                <span className="font-black text-amber-600 dark:text-amber-400">{formatNumber(viewInvoice.remaining_amount)}</span>
              </div>
            </div>

            {viewInvoice.notes && (
              <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
                {viewInvoice.notes}
              </div>
            )}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-black text-slate-400">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">{value}</div>
    </div>
  );
}

function InvoicesPage() {
  return (
    <Suspense fallback={<div />}>
      <InvoicesContent />
    </Suspense>
  );
}

export default InvoicesPage;