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
  TrendingUp,
  History
} from 'lucide-react';
import type { JournalEntry, JournalEntryLine, Account } from '@/types';
import { AccountingRepository } from '@/modules/accounting/accounting_repository';

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);
  const [detailLines, setDetailLines] = useState<Array<JournalEntryLine & { accountName: string; accountCode: string }>>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pageSize, setPageSize] = useState('25');

  const openDetails = async (entry: JournalEntry) => {
    try {
      const { db } = await import('@/core/db/app_database');
      const [lines, accounts] = await Promise.all([
        db.journal_entry_lines.where('entry_id').equals(entry.id).toArray(),
        db.accounts.where('org_id').equals(orgId).toArray(),
      ]);
      const accById = new Map<string, Account>(accounts.map((a) => [a.id, a]));
      setDetailLines(
        lines.map((line) => {
          const acc = accById.get(line.account_id);
          return { ...line, accountName: acc?.name ?? '-', accountCode: acc?.code ?? '-' };
        })
      );
      setDetailEntry(entry);
      setIsDetailsOpen(true);
    } catch (err) {
      console.error('Load entry lines error:', err);
      toast.error('تعذر تحميل تفاصيل القيد');
    }
  };

  const loadData = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      await AccountingRepository.ensureDefaultChartOfAccounts(orgId);
      const { db } = await import('@/core/db/app_database');
      const journalList = await db.journal_entries.where('org_id').equals(orgId).reverse().sortBy('entry_date');
      setEntries(journalList);
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
    return entries.filter(e => {
      const matchesType = typeFilter === 'all' || e.type === typeFilter;
      const matchesSearch = !searchQuery ||
        e.entry_no.includes(searchQuery) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [entries, searchQuery, typeFilter]);

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
      subtitle="سجل الحركات المالية المزدوجة لكافة عمليات المنشأة لضمان الشفافية والرقابة المحاسبية."
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="general">قيد عام</SelectItem>
                    <SelectItem value="sales">مبيعات</SelectItem>
                    <SelectItem value="purchases">مشتريات</SelectItem>
                    <SelectItem value="voucher">سندات</SelectItem>
                    <SelectItem value="expenses">مصروفات</SelectItem>
                    <SelectItem value="payroll">رواتب</SelectItem>
                    <SelectItem value="reversal">قيد عكسي</SelectItem>
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
                        {entryTypeLabel(e.type)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium truncate max-w-xs">{e.description}</td>
                    <td className="py-4 px-4 text-left text-blue-600 font-black text-sm">
                      {formatNumber(e.total_amount)} <span className="text-[10px] opacity-70">ج.م</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => openDetails(e)}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                      >
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

        {isDetailsOpen && detailEntry && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDetailsOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden" dir="rtl">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">قيد #{detailEntry.entry_no}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">{detailEntry.description}</p>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-black cursor-pointer">
                  إغلاق
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/40 text-[11px] font-black text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 px-4">الحساب</th>
                      <th className="py-3 px-4 text-left w-28">مدين</th>
                      <th className="py-3 px-4 text-left w-28">دائن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-xs font-bold">
                    {detailLines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                          <span className="font-mono text-slate-400 mr-2">{line.accountCode}</span>
                          {line.accountName}
                        </td>
                        <td className="py-3 px-4 text-left font-mono text-blue-600">{line.debit ? formatNumber(line.debit) : '-'}</td>
                        <td className="py-3 px-4 text-left font-mono text-amber-600">{line.credit ? formatNumber(line.credit) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-black">
                      <td className="py-3 px-4">الإجمالي</td>
                      <td className="py-3 px-4 text-left font-mono text-blue-700">{formatNumber(detailLines.reduce((s, l) => s + l.debit, 0))}</td>
                      <td className="py-3 px-4 text-left font-mono text-amber-700">{formatNumber(detailLines.reduce((s, l) => s + l.credit, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

function entryTypeLabel(type: JournalEntry['type']): string {
  const labels: Record<string, string> = {
    general: 'قيد عام',
    sales: 'مبيعات',
    purchases: 'مشتريات',
    voucher: 'سندات',
    expenses: 'مصروفات',
    payroll: 'رواتب',
    reversal: 'قيد عكسي',
    closing: 'إقفال',
  };
  return labels[type] ?? 'قيد عام';
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
