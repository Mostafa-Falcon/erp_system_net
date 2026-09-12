'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { TreasuryRepository } from '@/modules/treasury/treasury_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import type { Contact, FinancialVoucher, Treasury, User } from '@/types';

const selectCls =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

function VouchersContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const params = useSearchParams();

  const [vouchers, setVouchers] = useState<FinancialVoucher[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [treasuryFilter, setTreasuryFilter] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [vType, setVType] = useState<'receipt' | 'payment'>('receipt');
  const [vTreasuryId, setVTreasuryId] = useState('');
  const [vContactId, setVContactId] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vDescription, setVDescription] = useState('');
  const [vReference, setVReference] = useState('');
  const [formError, setFormError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [vch, tres, cnt, usr] = await Promise.all([
        TreasuryRepository.getVouchers(orgId),
        TreasuryRepository.getTreasuries(orgId),
        db.contacts.where('org_id').equals(orgId).and((c) => c.is_active).toArray(),
        db.users.where('org_id').equals(orgId).toArray(),
      ]);
      setVouchers(vch);
      setTreasuries(tres);
      setContacts(cnt);
      setUsers(usr);
      const presetTreasury = params.get('treasury');
      const validPreset = vch ? (presetTreasury && tres.some((t) => t.id === presetTreasury) ? presetTreasury : '') : '';
      setVTreasuryId((prev) => prev || validPreset || tres.find((t) => t.is_default)?.id || tres[0]?.id || '');
    } catch (err) {
      console.error('Load vouchers error:', err);
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
    return vouchers.filter((v) => {
      if (typeFilter && v.type !== typeFilter) return false;
      if (treasuryFilter && v.treasury_id !== treasuryFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const contact = contacts.find((c) => c.id === v.contact_id)?.name || '';
      return v.voucher_no.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || contact.toLowerCase().includes(q);
    });
  }, [vouchers, search, typeFilter, treasuryFilter, contacts]);

  const totals = useMemo(() => {
    const receipts = filtered.filter((v) => v.type === 'receipt').reduce((a, v) => a + v.amount, 0);
    const payments = filtered.filter((v) => v.type === 'payment').reduce((a, v) => a + v.amount, 0);
    return { receipts, payments, net: receipts - payments, count: filtered.length };
  }, [filtered]);

  const createVoucher = async () => {
    setFormError('');
    if (!currentUser) return;
    if (!vTreasuryId) {
      setFormError('اختر الخزينة.');
      return;
    }
    const amount = Number(vAmount);
    if (!amount || amount <= 0) {
      setFormError('أدخل مبلغاً صحيحاً أكبر من صفر.');
      return;
    }
    if (!vDescription.trim()) {
      setFormError('أدخل بيان السند.');
      return;
    }
    setIsBusy(true);
    try {
      await TreasuryRepository.createVoucher({
        orgId,
        type: vType,
        treasuryId: vTreasuryId,
        contactId: vContactId || null,
        amount,
        description: vDescription.trim(),
        referenceNo: vReference.trim() || undefined,
        userId: currentUser.id,
      });
      setVAmount('');
      setVDescription('');
      setVReference('');
      setVContactId('');
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء السند.');
    } finally {
      setIsBusy(false);
    }
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.username || '—';
  const treasuryName = (id: string) => treasuries.find((t) => t.id === id)?.name || '—';
  const contactName = (id?: string | null) => (id ? contacts.find((c) => c.id === id)?.name : undefined);

  const viewVoucher = viewId ? vouchers.find((v) => v.id === viewId) : undefined;

  return (
    <AppShell title="سندات القبض والصرف" subtitle="تسجيل القبض (زيادة الرصيد) والصرف (نقصان الرصيد) على الخزائن والبنوك">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="إجمالي القبض" value={formatNumber(totals.receipts)} accent="#558b2f" />
          <Kpi label="إجمالي الصرف" value={formatNumber(totals.payments)} accent="#d97706" />
          <Kpi label="صافي الحركة" value={formatNumber(totals.net)} accent="#2563eb" />
          <Kpi label="عدد السندات" value={String(totals.count)} accent="#64748b" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالرقم أو البيان أو الطرف..."
                className="h-10 bg-slate-50 dark:bg-slate-900 text-xs pr-9"
                icon={<Icons.Search />}
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls + ' w-40'}>
              <option value="">كل الأنواع</option>
              <option value="receipt">قبض</option>
              <option value="payment">صرف</option>
            </select>
            <select value={treasuryFilter} onChange={(e) => setTreasuryFilter(e.target.value)} className={selectCls + ' w-44'}>
              <option value="">كل الخزائن</option>
              {treasuries.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex-1" />
            <Button onClick={() => setShowCreate((v) => !v)} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              {showCreate ? 'إغلاق' : 'سند جديد'} {showCreate ? <Icons.X /> : <Icons.Plus />}
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع السند</span>
                  <select
                    value={vType}
                    onChange={(e) => {
                      setVType(e.target.value as 'receipt' | 'payment');
                      setVContactId('');
                    }}
                    className={selectCls + ' w-full'}
                  >
                    <option value="receipt">قبض (إيداع)</option>
                    <option value="payment">صرف (سحب)</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الخزينة</span>
                  <select value={vTreasuryId} onChange={(e) => setVTreasuryId(e.target.value)} className={selectCls + ' w-full'}>
                    {treasuries.length === 0 && <option value="">لا توجد خزائن — أضف خزينة أولاً</option>}
                    {treasuries.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({formatNumber(t.current_balance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ</span>
                  <Input type="number" min={0} step="any" value={vAmount} onChange={(e) => setVAmount(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="0.00" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الطرف (اختياري)</span>
                  <select value={vContactId} onChange={(e) => setVContactId(e.target.value)} className={selectCls + ' w-full'}>
                    <option value="">بدون طرف</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} — {c.type === 'both' ? 'عميل/مورد' : c.type === 'customer' ? 'عميل' : 'مورد'}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البيان</span>
                  <Input type="text" value={vDescription} onChange={(e) => setVDescription(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="مثال: سداد قيمة فاتورة مورد..." />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم مرجعي (اختياري)</span>
                  <Input type="text" value={vReference} onChange={(e) => setVReference(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="رقم الفاتورة / الشيك..." />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={createVoucher} disabled={isBusy || treasuries.length === 0} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold">
                  {isBusy ? 'جارِ الحفظ...' : 'حفظ السند'}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">جارٍ تحميل السندات...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icons.Receipt /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد سندات مطابقة.</p>
              <p className="mt-1 text-xs text-slate-400">أنشئ سند قبض أو صرف لتسجيل الحركات المالية.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                    <th className="py-2.5 pr-3">السند</th>
                    <th className="py-2.5">النوع</th>
                    <th className="py-2.5">الخزينة</th>
                    <th className="py-2.5">الطرف</th>
                    <th className="py-2.5">البيان</th>
                    <th className="py-2.5">التاريخ</th>
                    <th className="py-2.5 pl-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id} onClick={() => setViewId(v.id)} className="cursor-pointer border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pr-3 font-black text-slate-900 dark:text-white">{v.voucher_no}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${v.type === 'receipt' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
                          {v.type === 'receipt' ? 'قبض' : 'صرف'}
                        </span>
                      </td>
                      <td className="py-3 text-[11px]">{treasuryName(v.treasury_id)}</td>
                      <td className="py-3 text-[11px]">{contactName(v.contact_id) || '—'}</td>
                      <td className="py-3 text-[11px] max-w-[200px] truncate">{v.description}</td>
                      <td className="py-3 text-[11px]">{formatDateTime(v.created_at)}</td>
                      <td className={`py-3 pl-3 font-black ${v.type === 'receipt' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {v.type === 'receipt' ? '+' : '-'}{formatNumber(v.amount)}
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
      {viewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131b2e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{viewVoucher.voucher_no}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {viewVoucher.type === 'receipt' ? 'سند قبض' : 'سند صرف'} · {formatDateTime(viewVoucher.created_at)}
                </p>
              </div>
              <button onClick={() => setViewId(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><Icons.X /></button>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 mb-4">
              <div className="text-[10px] font-black text-slate-400">المبلغ</div>
              <div className={`mt-0.5 text-2xl font-black ${viewVoucher.type === 'receipt' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {viewVoucher.type === 'receipt' ? '+' : '-'}{formatNumber(viewVoucher.amount)}
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Info label="الخزينة" value={treasuryName(viewVoucher.treasury_id)} />
              <Info label="الطرف" value={contactName(viewVoucher.contact_id) || '—'} />
              <Info label="البيان" value={viewVoucher.description} />
              {viewVoucher.reference_no && <Info label="الرقم المرجعي" value={viewVoucher.reference_no} />}
              <Info label="أُعد بواسطة" value={userName(viewVoucher.created_by)} />
            </div>
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

function VouchersPage() {
  return (
    <Suspense fallback={<div />}>
      <VouchersContent />
    </Suspense>
  );
}

export default VouchersPage;