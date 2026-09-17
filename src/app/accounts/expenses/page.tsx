'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { TreasuryRepository } from '@/modules/treasury/treasury_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Expense, ExpenseCategory, Treasury, User } from '@/types';

function ExpensesContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [treasuryFilter, setTreasuryFilter] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [catName, setCatName] = useState('');
  const [eCategoryId, setECategoryId] = useState('');
  const [eTreasuryId, setETreasuryId] = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eDescription, setEDescription] = useState('');
  const [eReceipt, setEReceipt] = useState('');
  const [formError, setFormError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [exp, cats, tres, usr] = await Promise.all([
        TreasuryRepository.getExpenses(orgId),
        TreasuryRepository.getExpenseCategories(orgId),
        TreasuryRepository.getTreasuries(orgId),
        db.users.where('org_id').equals(orgId).toArray(),
      ]);
      setExpenses(exp);
      setCategories(cats);
      setTreasuries(tres);
      setUsers(usr);
      const activeCat = cats.find((c) => c.is_active)?.id;
      setECategoryId((prev) => prev || activeCat || '');
      setETreasuryId((prev) => prev || tres.find((t) => t.is_default)?.id || tres[0]?.id || '');
    } catch (err) {
      console.error('Load expenses error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const activeCategories = useMemo(() => categories.filter((c) => c.is_active), [categories]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name || '—';

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter && categoryFilter !== 'all' && e.category_id !== categoryFilter) return false;
      if (treasuryFilter && treasuryFilter !== 'all' && e.treasury_id !== treasuryFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const eCategoryName = categories.find((c) => c.id === e.category_id)?.name || '';
      return (
        e.description.toLowerCase().includes(q) ||
        (e.receipt_number || '').toLowerCase().includes(q) ||
        eCategoryName.toLowerCase().includes(q)
      );
    });
  }, [expenses, search, categoryFilter, treasuryFilter, categories]);

  const totals = useMemo(() => {
    const byCat: Record<string, number> = {};
    let total = 0;
    for (const e of filtered) {
      total += e.amount;
      byCat[e.category_id] = (byCat[e.category_id] || 0) + e.amount;
    }
    return { total, count: filtered.length, byCat };
  }, [filtered]);

  const createExpense = async () => {
    setFormError('');
    if (!currentUser) return;
    if (!eCategoryId) {
      setFormError('أضف فئة مصروفات أولاً أو اختر الفئة.');
      return;
    }
    if (!eTreasuryId) {
      setFormError('اختر الخزينة.');
      return;
    }
    const amount = Number(eAmount);
    if (!amount || amount <= 0) {
      setFormError('أدخل مبلغاً صحيحاً أكبر من صفر.');
      return;
    }
    if (!eDescription.trim()) {
      setFormError('أدخل بيان المصروف.');
      return;
    }
    setIsBusy(true);
    try {
      await TreasuryRepository.recordExpense({
        orgId,
        categoryId: eCategoryId,
        treasuryId: eTreasuryId,
        amount,
        description: eDescription.trim(),
        receiptNumber: eReceipt.trim() || undefined,
        userId: currentUser.id,
      });
      setEAmount('');
      setEDescription('');
      setEReceipt('');
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل المصروف.');
    } finally {
      setIsBusy(false);
    }
  };

  const addCategory = async () => {
    setFormError('');
    if (!catName.trim()) {
      setFormError('أدخل اسم الفئة.');
      return;
    }
    setIsBusy(true);
    try {
      await TreasuryRepository.createExpenseCategory(orgId, catName.trim());
      setCatName('');
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الفئة.');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleCategory = async (id: string) => {
    try {
      await TreasuryRepository.toggleExpenseCategoryActive(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ أثناء تحديث الفئة.');
    }
  };

  const treasuryName = (id: string) => treasuries.find((t) => t.id === id)?.name || '—';
  const userName = (id: string) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.username || '—';

  const viewExpense = viewId ? expenses.find((e) => e.id === viewId) : undefined;

  const topCategory = useMemo(() => {
    const entries = Object.entries(totals.byCat);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { id: entries[0][0], amount: entries[0][1] };
  }, [totals.byCat]);

  return (
    <AppShell title="المصروفات التشغيلية" subtitle="تسجيل مصروفات التشغيل (إيجار، كهرباء، رواتب، نقل...) مع خصمها تلقائياً من الخزينة">
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="إجمالي المصروفات" value={formatNumber(totals.total)} accent="#ef4444" />
          <Kpi label="عدد العمليات" value={String(totals.count)} accent="#64748b" />
          <Kpi label="أعلى فئة" value={topCategory ? categoryName(topCategory.id) : '—'} accent="#d97706" />
          <Kpi label="أعلى فئة مبلغاً" value={formatNumber(topCategory?.amount || 0)} accent="#4338ca" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالبيان أو رقم الإيصال..."
                className="h-10 bg-slate-50 dark:bg-slate-900 text-xs pr-9"
                icon={<Icons.Search />}
              />
            </div>
            <div className="w-44">
              <Select value={categoryFilter || 'all'} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <SelectValue placeholder="كل الفئات" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60">
                  <SelectItem value="all" className="">
                    كل الفئات
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-44">
              <Select value={treasuryFilter || 'all'} onValueChange={setTreasuryFilter}>
                <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <SelectValue placeholder="كل الخزائن" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                  <SelectItem value="all" className="">
                    كل الخزائن
                  </SelectItem>
                  {treasuries.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Button onClick={() => setShowCategories((v) => !v)} className="h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Icons.Filter /> الفئات
            </Button>
            <Button onClick={() => setShowCreate((v) => !v)} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              {showCreate ? 'إغلاق' : 'مصروف جديد'} {showCreate ? <Icons.X /> : <Icons.Plus />}
            </Button>
          </div>

          {/* Categories panel */}
          {showCategories && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">فئات المصروفات</h4>
              </div>
              <div className="flex gap-2 items-center">
                <Input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} className="h-9 bg-white dark:bg-slate-900 text-xs max-w-xs" placeholder="اسم الفئة الجديدة" />
                <Button onClick={addCategory} disabled={isBusy} className="h-9 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Icons.Plus /> إضافة
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${c.is_active ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                    {c.name}
                    <button onClick={() => toggleCategory(c.id)} className="hover:text-red-500" title={c.is_active ? 'إيقاف الفئة' : 'تفعيل الفئة'}>
                      <Icons.X />
                    </button>
                  </span>
                ))}
                {categories.length === 0 && <span className="text-[11px] font-bold text-slate-400">لا توجد فئات بعد — أضف أول فئة.</span>}
              </div>
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الفئة</span>
                  <Select value={eCategoryId} onValueChange={setECategoryId}>
                    <SelectTrigger className="w-full h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60">
                      {activeCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الخزينة</span>
                  <Select value={eTreasuryId} onValueChange={setETreasuryId}>
                    <SelectTrigger className="w-full h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold">
                      <SelectValue placeholder="اختر الخزينة" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                      {treasuries.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ</span>
                  <Input type="number" min={0} step="any" value={eAmount} onChange={(e) => setEAmount(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="0.00" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الإيصال (اختياري)</span>
                  <Input type="text" value={eReceipt} onChange={(e) => setEReceipt(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="رقم الإيصال / الفاتورة" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البيان</span>
                  <Input type="text" value={eDescription} onChange={(e) => setEDescription(e.target.value)} className="h-10 bg-white dark:bg-slate-900 text-xs" placeholder="مثال: فاتورة كهرباء الشهر" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={createExpense} disabled={isBusy || activeCategories.length === 0 || treasuries.length === 0} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold">
                  {isBusy ? 'جارِ الحفظ...' : 'تسجيل المصروف'}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">جارٍ تحميل المصروفات...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icons.Calculator /></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد مصروفات مطابقة.</p>
              <p className="mt-1 text-xs text-slate-400">سجّل أول مصروف تشغيلي.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                    <th className="py-2.5 pr-3">الفئة</th>
                    <th className="py-2.5">الخزينة</th>
                    <th className="py-2.5">البيان</th>
                    <th className="py-2.5">الإيصال</th>
                    <th className="py-2.5">التاريخ</th>
                    <th className="py-2.5">بواسطة</th>
                    <th className="py-2.5 pl-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} onClick={() => setViewId(e.id)} className="cursor-pointer border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 pr-3">
                        <span className="rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 text-[10px] font-black">{categoryName(e.category_id)}</span>
                      </td>
                      <td className="py-3 text-[11px]">{treasuryName(e.treasury_id)}</td>
                      <td className="py-3 text-[11px] max-w-[220px] truncate">{e.description}</td>
                      <td className="py-3 text-[11px]">{e.receipt_number || '—'}</td>
                      <td className="py-3 text-[11px]">{formatDateTime(e.created_at)}</td>
                      <td className="py-3 text-[11px]">{userName(e.created_by)}</td>
                      <td className="py-3 pl-3 font-black text-red-500">-{formatNumber(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131b2e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{categoryName(viewExpense.category_id)}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{formatDateTime(viewExpense.created_at)}</p>
              </div>
              <button onClick={() => setViewId(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><Icons.X /></button>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 mb-4">
              <div className="text-[10px] font-black text-slate-400">المبلغ</div>
              <div className="mt-0.5 text-2xl font-black text-red-500">-{formatNumber(viewExpense.amount)}</div>
            </div>

            <div className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Info label="البيان" value={viewExpense.description} />
              <Info label="الخزينة" value={treasuryName(viewExpense.treasury_id)} />
              {viewExpense.receipt_number && <Info label="رقم الإيصال" value={viewExpense.receipt_number} />}
              <Info label="بواسطة" value={userName(viewExpense.created_by)} />
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

export default function ExpensesPage() {
  return <ExpensesContent />;
}