'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Banknote, FileSpreadsheet, Receipt, Wallet, Search, FilterX, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PayrollPage() {
  return (
    <AppShell
      title="مسيرات الرواتب"
      subtitle="إدارة المستحقات المالية، البدلات، الخصومات وصرف الرواتب الشهرية."
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="إجمالي الرواتب" value="45,000" icon={<Banknote className="w-6 h-6" />} color="blue" />
          <StatCard label="تم صرفه" value="12,500" icon={<Wallet className="w-6 h-6" />} color="emerald" />
          <StatCard label="بانتظار الصرف" value="32,500" icon={<Receipt className="w-6 h-6" />} color="amber" />
          <StatCard label="عدد المسيرات" value="1" icon={<FileSpreadsheet className="w-6 h-6" />} color="indigo" isNumber />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative group w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="بحث في المسيرات..."
                className="h-10 pr-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              />
            </div>

            <Select defaultValue="09-2026">
              <SelectTrigger className="w-40 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09-2026">سبتمبر 2026</SelectItem>
                <SelectItem value="08-2026">أغسطس 2026</SelectItem>
                <SelectItem value="07-2026">يوليو 2026</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" className="text-red-500 hover:text-red-600 font-bold text-xs gap-1.5 h-10">
              <FilterX className="w-4 h-4" /> مسح الفلاتر
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 rounded-xl">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> تصدير إكسل
            </Button>
            <Button className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> إنشاء مسيرة رواتب
            </Button>
          </div>
        </div>

        {/* Placeholder Table Content */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs py-24 text-center">
           <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              <Banknote className="w-8 h-8" />
           </div>
           <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">مسيرات الرواتب الشهرية</h3>
           <p className="text-xs text-slate-400 max-w-sm mx-auto">لم يتم إصدار مسيرات رواتب للشهر الحالي حتى الآن. يمكنك البدء بإضافة مسيرة جديدة ومراجعة كشوفات الموظفين.</p>
        </div>

      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, color, isNumber = false }: { label: string, value: string | number, icon: React.ReactNode, color: 'emerald' | 'amber' | 'red' | 'blue' | 'indigo', isNumber?: boolean }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex items-center gap-4 shadow-xs">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-black text-slate-400 block mb-0.5 uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-black ${colors[color].split(' ')[1]}`}>{value}</span>
          {!isNumber && <span className="text-[10px] font-bold text-slate-400">ج.م</span>}
        </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
