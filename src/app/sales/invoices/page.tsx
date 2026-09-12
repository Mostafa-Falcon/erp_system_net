'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import type { Contact, Product, SalesInvoice, SalesInvoiceItem, Treasury, Unit, Warehouse } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const PAY_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  credit: 'آجل',
  split: 'سداد مشترك',
};

function InvoicesContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const router = useRouter();

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [itemsByInvoice, setItemsByInvoice] = useState<Record<string, SalesInvoiceItem[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [invList, allItems, prods, unts, tres, whs, custs] = await Promise.all([
        SalesRepository.getSalesInvoices(orgId),
        db.sales_invoice_items.toArray(),
        db.products.where('org_id').equals(orgId).toArray(),
        db.units.where('org_id').equals(orgId).toArray(),
        db.treasuries.where('org_id').equals(orgId).toArray(),
        db.warehouses.where('org_id').equals(orgId).toArray(),
        db.contacts.where('org_id').equals(orgId).and((c) => c.is_active).toArray(),
      ]);

      const grouped: Record<string, SalesInvoiceItem[]> = {};
      for (const it of allItems) {
        (grouped[it.invoice_id] = grouped[it.invoice_id] || []).push(it);
      }

      setInvoices(invList);
      setItemsByInvoice(grouped);
      setProducts(prods);
      setUnits(unts);
      setTreasuries(tres);
      setWarehouses(whs);
      setCustomers(custs);
    } catch (err) {
      console.error('Load sales invoices error:', err);
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
      if (customerFilter && inv.customer_id !== customerFilter) return false;
      if (payFilter && inv.payment_type !== payFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const custName = (customers.find((x) => x.id === inv.customer_id)?.name || 'نقدي').toLowerCase();
      return inv.invoice_number.toLowerCase().includes(q) || custName.includes(q);
    });
  }, [invoices, search, customerFilter, payFilter, customers]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (a, inv) => ({
        total: a.total + inv.total,
        paid: a.paid + inv.paid_amount,
        remaining: a.remaining + inv.remaining_amount,
        count: a.count + 1,
      }),
      { total: 0, paid: 0, remaining: 0, count: 0 }
    );
  }, [filtered]);

  const viewInvoice = viewId ? invoices.find((i) => i.id === viewId) : undefined;
  const viewItems = viewId ? itemsByInvoice[viewId] || [] : [];

  const openReturn = async (invoice: SalesInvoice) => {
    if (!confirm(`إنشاء مرتجع من فاتورة «${invoice.invoice_number}»؟ ستُجهّز أصنافها للمرتجع.`)) return;
    router.push(`/sales/returns/new?invoice=${invoice.id}&customer=${invoice.customer_id || ''}&warehouse=${invoice.warehouse_id}`);
  };

  return (
    <AppShell title="فواتير المبيعات" subtitle="سجل مبيعات المنشأة — مرتبط بالعملاء والخزائن والورديات ويخصم المخزون">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="عدد الفواتير" value={String(totals.count)} accent="#558b2f" />
          <Kpi label="إجمالي المبيعات" value={formatNumber(totals.total)} accent="#0f766e" />
          <Kpi label="المحصل" value={formatNumber(totals.paid)} accent="#2563eb" />
          <Kpi label="مستحق على العملاء" value={formatNumber(totals.remaining)} accent="#d97706" />
        </div>

        {/* Toolbar & Data Table */}
        <Card className="p-4 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-56">
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالرقم أو العميل..."
                  className="h-10 text-xs pr-9"
                  icon={<Icons.Search />}
                />
              </div>
              <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className={selectCls + ' w-40'}>
                <option value="">كل العملاء</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className={selectCls + ' w-32'}>
                <option value="">كل الدفعات</option>
                {Object.entries(PAY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => router.push('/sales/pos')} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Icons.Sales /> نقطة البيع
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">جارٍ تحميل الفواتير...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icons.Receipt /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد فواتير مبيعات بعد.</p>
              <p className="mt-1 text-xs text-slate-400">ابدأ من نقطة البيع لصنع أول فاتورة.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                  <TableHead className="py-2.5 pr-3">الرقم</TableHead>
                  <TableHead className="py-2.5">العميل</TableHead>
                  <TableHead className="py-2.5">المخزن</TableHead>
                  <TableHead className="py-2.5">التاريخ</TableHead>
                  <TableHead className="py-2.5">الدفع</TableHead>
                  <TableHead className="py-2.5 pl-3">الإجمالي</TableHead>
                  <TableHead className="py-2.5 pl-3">المتبقي</TableHead>
                  <TableHead className="py-2.5 pl-3 text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id} className="border-b border-slate-100 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <TableCell className="py-3 pr-3 font-black text-[#558b2f]">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="py-3">{nameOf(customers, inv.customer_id)}</TableCell>
                    <TableCell className="py-3 text-[11px]">{nameOf(warehouses, inv.warehouse_id)}</TableCell>
                    <TableCell className="py-3 text-[11px]">{formatDateTime(inv.invoice_date)}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="font-medium text-[10px]">
                        {PAY_LABELS[inv.payment_type] || inv.payment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 pl-3 text-[#558b2f] font-black">{formatNumber(inv.total)}</TableCell>
                    <TableCell className="py-3 pl-3">
                      {inv.remaining_amount > 0 ? (
                        <Badge variant="warning" className="text-[10px] font-black">
                          {formatNumber(inv.remaining_amount)}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          مُحَصّلة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pl-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewId(inv.id)} title="عرض" className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-[#558b2f] cursor-pointer"><Icons.Eye /></button>
                        <button onClick={() => openReturn(inv)} title="مرتجع" className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-red-500 cursor-pointer"><Icons.ReturnArrow /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* View modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewId(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131b2e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#558b2f]"><Icons.Receipt /></span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{viewInvoice.invoice_number}</h3>
              </div>
              <button onClick={() => setViewId(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><Icons.X /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Info label="العميل" value={nameOf(customers, viewInvoice.customer_id)} />
              <Info label="المخزن" value={nameOf(warehouses, viewInvoice.warehouse_id)} />
              <Info label="التاريخ" value={formatDateTime(viewInvoice.invoice_date)} />
              <Info label="طريقة الدفع" value={PAY_LABELS[viewInvoice.payment_type] || viewInvoice.payment_type} />
              <Info label="الخزينة" value={nameOf(treasuries, viewInvoice.treasury_id)} />
              <Info label="الخصم" value={formatNumber(viewInvoice.discount_amount)} />
            </div>

            <table className="w-full text-right mb-4">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                  <th className="py-2">الصنف</th>
                  <th className="py-2">الوحدة</th>
                  <th className="py-2">الكمية</th>
                  <th className="py-2">السعر</th>
                  <th className="py-2">الضريبة</th>
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
                      <td className="py-2.5">{formatNumber(it.quantity)}</td>
                      <td className="py-2.5">{formatNumber(it.unit_price)}</td>
                      <td className="py-2.5 text-[11px]">{it.tax_rate}%</td>
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
                <span className="text-slate-400">المحصل:</span>{' '}
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
    <Card className="p-4 shadow-xs">
      <div className="text-[10px] font-black text-slate-400 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black" style={{ color: accent }}>{value}</div>
    </Card>
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