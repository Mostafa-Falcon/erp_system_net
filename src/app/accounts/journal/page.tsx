'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/core/state/useSessionStore';
import { formatNumber } from '@/lib/format';
import { toast } from 'sonner';
import {
  RefreshCw,
  Printer,
  FileText,
  FileSpreadsheet,
  SlidersHorizontal,
  Search,
  Eye,
  FileDown,
  Calendar,
  FilterX,
  BookOpen,
  LayoutGrid,
  TrendingUp,
  History
} from 'lucide-react';
import type { JournalEntry, SalesInvoice, PurchaseInvoice, FinancialVoucher, Expense } from '@/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function JournalEntriesPage() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('25');

  const loadData = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const { db } = await import('@/core/db/app_database');

      // Fetch real journal entries if any
      const journalList = await db.journal_entries.where('org_id').equals(orgId).reverse().sortBy('entry_date');

      // If empty, let's derive some "virtual" entries from other documents for demonstration/professionalism
      if (journalList.length === 0) {
        const [sales, purchases, vouchers, expenses] = await Promise.all([
          db.sales_invoices.where('org_id').equals(orgId).limit(50).toArray(),
          db.purchase_invoices.where('org_id').equals(orgId).limit(20).toArray(),
          db.financial_vouchers.where('org_id').equals(orgId).limit(50).toArray(),
          db.expenses.where('org_id').equals(orgId).limit(50).toArray(),
        ]);

        const derived: JournalEntry[] = [
          ...sales.map(s => ({
            id: `sale-${s.id}`,
            org_id: orgId,
            entry_no: s.invoice_number.replace('INV-', ''),
            entry_date: s.invoice_date,
            type: 'sales' as const,
            description: `قيد مبيعات - فاتورة رقم ${s.invoice_number}`,
            total_amount: s.total,
            created_by: s.created_by,
            created_at: s.created_at
          })),
          ...vouchers.map(v => ({
            id: `vouch-${v.id}`,
            org_id: orgId,
            entry_no: v.voucher_no.split('-').pop() || '000',
            entry_date: v.created_at,
            type: 'general' as any,
            description: v.description,
            total_amount: v.amount,
            created_by: v.created_by,
            created_at: v.created_at
          }))
        ].sort((a, b) => b.entry_date.localeCompare(a.entry_date));

        setEntries(derived);
      } else {
        setEntries(journalList as any);
      }
    } catch (err) {
      console.error('Load journal error:', err);
      toast.error('حدث خطأ أثناء تحميل القيود');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e =>
      !searchQuery ||
      e.entry_no.includes(searchQuery) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return {
      totalCount: entries.length,
      totalVolume: entries.reduce((a, b) => a + b.total_amount, 0),
      todayCount: entries.filter(e => new Date(e.entry_date).toDateString() === today).length,
      monthCount: entries.filter(e => {
        const d = new Date(e.entry_date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length
    };
  }, [entries]);

  const headerActions = (
    <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs gap-2 shadow-sm shadow-blue-500/10 transition-all active:scale-95">
      <FileDown className="w-4 h-4" /> تصدير PDF
    </Button>
  );

  return (
    <AppShell
      title="قيود اليومية العامة"
      subtitle="سجل الحركات المالية المزدوجة لكافة عمليات الصيدلية لضمان الشفافية والرقابة المحاسبية."
      actions={headerActions}
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* ==================== SUMMARY CARDS ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="إجمالي القيود" value={stats.totalCount} icon={<BookOpen className="w-6 h-6" />} color="blue" isNumber />
          <StatCard label="إجمالي الحركات المالية" value={stats.totalVolume} icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
          <StatCard label="عمليات اليوم" value={stats.todayCount} icon={<History className="w-6 h-6" />} color="indigo" isNumber />
          <StatCard label="قيود هذا الشهر" value={stats.monthCount} icon={<Calendar className="w-6 h-6" />} color="amber" isNumber />
        </div>

        {/* ==================== FILTERS & TOOLBAR ==================== */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">

          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400">نوع القيد</span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="general">قيد عام</SelectItem>
                    <SelectItem value="sales">مبيعات</SelectItem>
                    <SelectItem value="purchases">مشتريات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => { setSearchQuery(''); }}
                className="h-10 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold gap-1.5"
              >
                <FilterX className="w-4 h-4" /> مسح الكل
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>عرض</span>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="w-16 h-10 rounded-xl bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>إدخالات</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={loadData} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer">
                <Printer className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer">
                <FileText className="w-4 h-4 text-blue-500" />
              </button>
              <button className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </button>

              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />

              <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 text-xs font-bold gap-1.5 rounded-xl">
                <SlidersHorizontal className="w-4 h-4" /> تخصيص الأعمدة
              </Button>
            </div>

            <div className="relative group">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث سريع في الجدول..."
                className="h-10 pr-9 w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                {filteredEntries.length}
              </span>
            </div>
          </div>

          {/* ==================== DATA GRID ==================== */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 w-24">رقم القيد</th>
                  <th className="py-4 px-4">تاريخ القيد</th>
                  <th className="py-4 px-4 text-center">النوع</th>
                  <th className="py-4 px-4">البيان والوصف</th>
                  <th className="py-4 px-4 text-left">القيمة الإجمالية</th>
                  <th className="py-4 px-4 text-center w-28">معاينة القيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs font-bold">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="py-4 px-4 text-blue-600 font-black">#{e.entry_no}</td>
                    <td className="py-4 px-4 text-slate-500 font-medium font-mono">
                      {new Date(e.entry_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {e.type === 'sales' ? 'مبيعات' : e.type === 'purchases' ? 'مشتريات' : 'قيد عام'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium truncate max-w-xs">{e.description}</td>
                    <td className="py-4 px-4 text-left text-blue-600 font-black text-sm">
                      {formatNumber(e.total_amount)} <span className="text-[10px] opacity-70">ج.م</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-black">لا توجد قيود يومية مسجلة للعرض.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-slate-50/20 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <div>عرض 1 إلى {filteredEntries.length} من إجمالي {entries.length} قيد</div>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white transition-colors cursor-pointer text-xs">«</button>
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">1</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white transition-colors cursor-pointer text-xs">»</button>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, color, isNumber = false }: { label: string, value: number, icon: React.ReactNode, color: 'blue' | 'emerald' | 'indigo' | 'amber', isNumber?: boolean }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-1">{label}</span>
          <span className={`text-xl font-black ${colors[color].split(' ')[1]}`}>
            {isNumber ? value : formatNumber(value)} {!isNumber && <span className="text-[10px] font-bold mr-0.5">ج.م</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
