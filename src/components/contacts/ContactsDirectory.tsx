'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ContactsRepository } from '@/modules/contacts/contacts_repository';
import { formatNumber } from '@/lib/format';
import type { Contact } from '@/types';

export type DirectoryKind = 'customer' | 'supplier';

const META: Record<DirectoryKind, { title: string; subtitle: string; gridLabel: string; countLabel: string; balanceLabel: string; addUrl: string }> = {
  customer: {
    title: 'دليل العملاء',
    subtitle: 'العملاء بمدروناتهم ورصيد حساباتهم — كل عميل بكشف حساب مستقل يضم معاملاته',
    gridLabel: 'العملاء',
    countLabel: 'عدد العملاء',
    balanceLabel: 'إجمالي المستحق على العملاء',
    addUrl: '/contacts/new?type=customer',
  },
  supplier: {
    title: 'دليل الموردين',
    subtitle: 'الموردون بمعاملاتهم وحساباتهم — كل مورد بكشف حساب مستقل ضمن فواتير وسندات صرف',
    gridLabel: 'الموردون',
    countLabel: 'عدد الموردين',
    balanceLabel: 'إجمالي المستحق للموردين',
    addUrl: '/contacts/new?type=supplier',
  },
};

function DirectoryContent({ kind }: { kind: DirectoryKind }) {
  const meta = META[kind];
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [statement, setStatement] = useState<
    { id: string; reference_type: string; reference_id: string; debit: number; credit: number; balance_after: number; notes?: string; created_at: string }[]
  >([]);
  const [invoices, setInvoices] = useState<
    { id: string; number: string; date: string; total: number; paid: number; remaining: number; status: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const list = await ContactsRepository.getContacts(orgId, kind);
      setContacts(list);
    } catch (err) {
      console.error('Load contacts error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (!detailId || !orgId) return;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const { db } = await import('@/core/db/app_database');
        const contact = await ContactsRepository.getById(detailId);
        if (contact && contact.org_id === orgId) {
          const stmt = await ContactsRepository.getStatement(detailId);
          setStatement(stmt);
          let inv: typeof invoices = [];
          if (contact.type === kind || contact.type === 'both') {
            if (kind === 'customer') {
              inv = (await db.sales_invoices.where('customer_id').equals(detailId).toArray()).map((i) => ({
                id: i.id,
                number: i.invoice_number,
                date: i.invoice_date,
                total: i.total,
                paid: i.paid_amount,
                remaining: i.remaining_amount,
                status: i.status,
              }));
            } else {
              inv = (await db.purchase_invoices.where('supplier_id').equals(detailId).toArray()).map((i) => ({
                id: i.id,
                number: i.system_invoice_number,
                date: i.invoice_date,
                total: i.total,
                paid: i.paid_amount,
                remaining: i.remaining_amount,
                status: i.status,
              }));
            }
          }
          setDetailContact(contact);
          setInvoices(inv);
        } else {
          setDetailContact(null);
        }
      } catch (err) {
        console.error('Load contact detail error:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    Promise.resolve().then(loadDetail);
  }, [detailId, orgId, kind]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...contacts]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [contacts, searchQuery]);

  const totals = useMemo(() => {
    let balance = 0;
    let debitCount = 0;
    for (const c of filtered) {
      balance += c.current_balance;
      if (c.current_balance > 0) debitCount += 1;
    }
    return { balance, debitCount };
  }, [filtered]);

  const closeDetail = () => router.push(kind === 'customer' ? '/contacts/customers' : '/contacts/suppliers');

  return (
    <AppShell
      title={meta.title}
      subtitle={meta.subtitle}
      actions={
        <Button
          onClick={() => router.push(meta.addUrl)}
          className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
        >
          <Icons.Plus /> جهة جديدة
        </Button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400">{meta.countLabel}</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatNumber(filtered.length)}</div>
        </Card>
        <Card className="p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400">{meta.balanceLabel}</span>
          <div className="text-xl font-black text-[#558b2f] mt-1">{formatNumber(totals.balance)}</div>
        </Card>
        <Card className="p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400">{kind === 'customer' ? 'عملاء مدينون' : 'موردون مدينون'}</span>
          <div className="text-xl font-black text-amber-600 mt-1">{formatNumber(totals.debitCount)}</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3 shadow-xs">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالاسم أو الكود أو الهاتف..."
          icon={<Icons.Search />}
          className="h-10 text-xs font-bold"
        />
      </Card>

      {/* Directory table */}
      <Card className="overflow-hidden shadow-xs print:border-0 p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <TableHead className="py-3.5 px-4">الجهة</TableHead>
              <TableHead className="py-3.5 px-4">الكود</TableHead>
              <TableHead className="py-3.5 px-4">الهاتف</TableHead>
              <TableHead className="py-3.5 px-4">حد الائتمان</TableHead>
              <TableHead className="py-3.5 px-4">رصيد الحساب</TableHead>
              <TableHead className="py-3.5 px-4 text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 font-semibold">جاري التحميل...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 font-semibold">لا توجد جهات بعد. أضف جهة جديدة.</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#16a34a] flex items-center justify-center">
                        <Icons.Contacts />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                        {c.type === 'both' && (
                          <Badge variant="secondary" className="text-[9px] text-[#558b2f] border-emerald-200 dark:border-emerald-800">عميل ومورد</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-slate-500">{c.code || '—'}</TableCell>
                  <TableCell className="py-3 px-4 text-slate-500" dir="ltr">{c.phone || c.mobile || '—'}</TableCell>
                  <TableCell className="py-3 px-4">{formatNumber(c.credit_limit)}</TableCell>
                  <TableCell className="py-3 px-4">
                    <span className={`font-black ${c.current_balance > 0 ? 'text-red-600' : c.current_balance < 0 ? 'text-[#558b2f]' : 'text-slate-400'}`}>
                      {formatNumber(c.current_balance)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(kind === 'customer' ? `/contacts/customers?id=${c.id}` : `/contacts/suppliers?id=${c.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="كشف المعاملات"
                      >
                        <Icons.Eye />
                      </button>
                      <button
                        onClick={() => router.push(`/contacts/new?edit=${c.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#558b2f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                        title="تعديل"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={async () => {
                          await ContactsRepository.setActive(c.id, !c.is_active);
                          await loadData();
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title={c.is_active ? 'تعطيل' : 'تفعيل'}
                      >
                        <Icons.X />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {detailContact?.name || 'تفاصيل الجهة'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {detailContact?.code ? `كود ${detailContact.code} • ` : ''}
                  {detailContact?.type === 'both'
                    ? 'عميل ومورد'
                    : detailContact?.type === 'customer'
                      ? 'عميل'
                      : 'مورد'}
                  {detailContact?.phone ? ` • ${detailContact.phone}` : ''}
                </p>
              </div>
              <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <Icons.X />
              </button>
            </div>

            {detailLoading || !detailContact ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">جاري تحميل الحساب والمعاملات...</div>
            ) : (
              <>
                {/* Balance card */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                    <span className="text-[10px] font-bold text-slate-400">رصيد الحساب</span>
                    <div className={`text-sm font-black mt-0.5 ${detailContact.current_balance > 0 ? 'text-red-600' : detailContact.current_balance < 0 ? 'text-[#558b2f]' : 'text-slate-500'}`}>
                      {formatNumber(detailContact.current_balance)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                    <span className="text-[10px] font-bold text-slate-400">حد الائتمان</span>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{formatNumber(detailContact.credit_limit)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                    <span className="text-[10px] font-bold text-slate-400">
                      {kind === 'customer' ? 'فواتير البيع' : 'فواتير الشراء'}
                    </span>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{formatNumber(invoices.length)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                    <span className="text-[10px] font-bold text-slate-400">إجمالي الفواتير</span>
                    <div className="text-sm font-black text-[#558b2f] mt-0.5">
                      {formatNumber(invoices.reduce((a, i) => a + i.total, 0))}
                    </div>
                  </div>
                </div>

                {detailContact.address && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 mb-4">{detailContact.address}</p>
                )}

                {/* Invoices */}
                <div className="mb-4">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
                    {kind === 'customer' ? 'فواتير البيع الخاصة بالعميل' : 'فواتير الشراء الخاصة بالمورد'}
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500">
                          <th className="py-2 px-3">الرقم</th>
                          <th className="py-2 px-3">التاريخ</th>
                          <th className="py-2 px-3">الإجمالي</th>
                          <th className="py-2 px-3">المسدد</th>
                          <th className="py-2 px-3">المتبقي</th>
                          <th className="py-2 px-3">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {invoices.length === 0 ? (
                          <tr><td colSpan={6} className="py-6 text-center text-slate-400">لا توجد فواتير بعد.</td></tr>
                        ) : (
                          invoices.map((i) => (
                            <tr key={i.id}>
                              <td className="py-2 px-3 font-mono font-black text-[#558b2f]">{i.number}</td>
                              <td className="py-2 px-3 text-slate-500">{new Date(i.date).toLocaleDateString('ar-EG')}</td>
                              <td className="py-2 px-3 font-black">{formatNumber(i.total)}</td>
                              <td className="py-2 px-3 text-emerald-600">{formatNumber(i.paid)}</td>
                              <td className="py-2 px-3 font-bold text-red-600">{formatNumber(i.remaining)}</td>
                              <td className="py-2 px-3 font-bold text-slate-500">{i.status === 'completed' ? 'مكتملة' : i.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Statement */}
                <div>
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2">كشف الحساب</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500">
                          <th className="py-2 px-3">التاريخ</th>
                          <th className="py-2 px-3">البيان</th>
                          <th className="py-2 px-3">مدين</th>
                          <th className="py-2 px-3">دائن</th>
                          <th className="py-2 px-3">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {statement.length === 0 ? (
                          <tr><td colSpan={5} className="py-6 text-center text-slate-400">لا توجد حركات حساب بعد.</td></tr>
                        ) : (
                          statement.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2 px-3 text-slate-500">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                              <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                                {s.notes || s.reference_type}
                              </td>
                              <td className="py-2 px-3 text-red-600">{s.debit ? formatNumber(s.debit) : '—'}</td>
                              <td className="py-2 px-3 text-emerald-600">{s.credit ? formatNumber(s.credit) : '—'}</td>
                              <td className="py-2 px-3 font-black">{formatNumber(s.balance_after)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export function ContactsDirectory({ kind }: { kind: DirectoryKind }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DirectoryContent kind={kind} />
    </Suspense>
  );
}