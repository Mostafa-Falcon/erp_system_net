'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import type { Contact, InventoryTransaction, Product, SalesReturn, Treasury, Unit, Warehouse } from '@/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function ReturnsContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const router = useRouter();

  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [itemsByReturn, setItemsByReturn] = useState<Record<string, InventoryTransaction[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; number: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [retList, allTx, prods, unts, tres, whs, custs, invList] = await Promise.all([
        SalesRepository.getSalesReturns(orgId),
        db.inventory_transactions
          .where('reference_type')
          .equals('sale_invoice')
          .toArray(),
        db.products.where('org_id').equals(orgId).toArray(),
        db.units.where('org_id').equals(orgId).toArray(),
        db.treasuries.where('org_id').equals(orgId).toArray(),
        db.warehouses.where('org_id').equals(orgId).toArray(),
        db.contacts.where('org_id').equals(orgId).and((c) => c.is_active).toArray(),
        db.sales_invoices.where('org_id').equals(orgId).toArray(),
      ]);

      const grouped: Record<string, InventoryTransaction[]> = {};
      for (const tx of allTx) {
        if (!tx.reference_id) continue;
        const invIds = new Set(invList.map((i) => i.id));
        // Return movements carry reference_id = returnId; filter out invoice movements.
        if (invIds.has(tx.reference_id)) continue;
        (grouped[tx.reference_id] = grouped[tx.reference_id] || []).push(tx);
      }

      setReturns(retList);
      setItemsByReturn(grouped);
      setProducts(prods);
      setUnits(unts);
      setTreasuries(tres);
      setWarehouses(whs);
      setCustomers(custs);
      setInvoices(invList.map((i) => ({ id: i.id, number: i.invoice_number })));
    } catch (err) {
      console.error('Load sales returns error:', err);
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
    return returns.filter((ret) => {
      if (customerFilter && customerFilter !== 'all' && ret.customer_id !== customerFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const custName = (customers.find((x) => x.id === ret.customer_id)?.name || 'نقدي').toLowerCase();
      return ret.return_number.toLowerCase().includes(q) || custName.includes(q);
    });
  }, [returns, search, customerFilter, customers]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (a, ret) => ({ total: a.total + ret.total, count: a.count + 1 }),
      { total: 0, count: 0 }
    );
  }, [filtered]);

  const viewReturn = viewId ? returns.find((r) => r.id === viewId) : undefined;
  const viewItems = viewId ? itemsByReturn[viewId] || [] : [];

  return (
    <AppShell title="مرتجعات المبيعات" subtitle="سجل استرجاع البضاعة من العملاء — يعيد المخزون ويخصم الخزينة">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Kpi label="عدد المرتجعات" value={String(totals.count)} accent="#558b2f" />
          <Kpi label="إجمالي المرتجعات" value={formatNumber(totals.total)} accent="#d97706" />
          <Kpi label="مرتجع من فاتورة" value={String(filtered.filter((r) => r.original_invoice_id).length)} accent="#0f766e" />
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
                  placeholder="بحث بالرقم أو العميل..."
                  className="h-10 bg-slate-50 dark:bg-slate-900 text-xs pr-9"
                  icon={<Icons.Search />}
                />
              </div>
              <div className="w-48">
                <Select value={customerFilter || 'all'} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <SelectValue placeholder="كل العملاء" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60">
                    <SelectItem value="all" className="">
                      كل العملاء
                    </SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => router.push('/sales/returns/new')} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Icons.Plus /> مرتجع جديد
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">جارٍ تحميل المرتجعات...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icons.ReturnArrow /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد مرتجعات مبيعات بعد.</p>
              <p className="mt-1 text-xs text-slate-400">ابدأ بمرتجع من فاتورة مبيعات أو مرتجع مباشر.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                    <th className="py-2.5 pr-3">رقم المرتجع</th>
                    <th className="py-2.5">العميل</th>
                    <th className="py-2.5">المخزن</th>
                    <th className="py-2.5">المصدر</th>
                    <th className="py-2.5">التاريخ</th>
                    <th className="py-2.5 pl-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ret) => (
                    <tr key={ret.id} onClick={() => setViewId(ret.id)} className="cursor-pointer border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pr-3 text-red-500 font-black">{ret.return_number}</td>
                      <td className="py-3">{nameOf(customers, ret.customer_id)}</td>
                      <td className="py-3 text-[11px]">{nameOf(warehouses, ret.warehouse_id)}</td>
                      <td className="py-3 text-[11px]">
                        {ret.original_invoice_id
                          ? invoices.find((i) => i.id === ret.original_invoice_id)?.number || 'فاتورة'
                          : 'مباشر'}
                      </td>
                      <td className="py-3 text-[11px]">{formatDateTime(ret.return_date)}</td>
                      <td className="py-3 pl-3 text-red-500 font-black">{formatNumber(ret.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewId(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131b2e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500"><Icons.ReturnArrow /></span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{viewReturn.return_number}</h3>
              </div>
              <button onClick={() => setViewId(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><Icons.X /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Info label="العميل" value={nameOf(customers, viewReturn.customer_id)} />
              <Info label="المخزن" value={nameOf(warehouses, viewReturn.warehouse_id)} />
              <Info label="المصدر" value={viewReturn.original_invoice_id ? invoices.find((i) => i.id === viewReturn.original_invoice_id)?.number || 'فاتورة' : 'مرتجع مباشر'} />
              <Info label="التاريخ" value={formatDateTime(viewReturn.return_date)} />
              <Info label="الخزينة" value={nameOf(treasuries, viewReturn.treasury_id)} />
              <Info label="إجمالي المرتجع" value={formatNumber(viewReturn.total)} />
            </div>

            {viewReturn.reason && (
              <div className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-black text-slate-500 dark:text-slate-400">سبب الإرجاع: </span>{viewReturn.reason}
              </div>
            )}

            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                  <th className="py-2">الصنف</th>
                  <th className="py-2">الوحدة</th>
                  <th className="py-2">الكمية</th>
                  <th className="py-2 pl-2">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {viewItems.map((tx) => {
                  const un = units.find((u) => u.id === tx.unit_id);
                  return (
                    <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <td className="py-2.5">{nameOf(products, tx.product_id)}</td>
                      <td className="py-2.5 text-[11px]">{un?.symbol || '—'}</td>
                      <td className="py-2.5">{formatNumber(Math.abs(tx.quantity))}</td>
                      <td className="py-2.5 pl-2 text-red-500 font-black">{formatNumber(Math.abs(tx.base_quantity * tx.unit_cost))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

function ReturnsPage() {
  return (
    <Suspense fallback={<div />}>
      <ReturnsContent />
    </Suspense>
  );
}

export default ReturnsPage;