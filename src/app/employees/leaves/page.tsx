'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileCheck, ShieldAlert, Search, FilterX, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LeavesPage() {
  return (
    <AppShell
      title="الإجازات والمغادرات"
      subtitle="إدارة طلبات الإجازات السنوية، المرضية، والمغادرات اليومية للموظفين."
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="طلبات معلقة" value={3} icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard label="في إجازة اليوم" value={1} icon={<Calendar className="w-6 h-6" />} color="blue" />
          <StatCard label="تمت الموافقة" value={24} icon={<FileCheck className="w-6 h-6" />} color="emerald" />
          <StatCard label="طلبات مرفوضة" value={2} icon={<ShieldAlert className="w-6 h-6" />} color="red" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative group w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="بحث في الطلبات..."
                className="h-10 pr-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              />
            </div>

            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-xs font-bold">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="approved">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" className="text-red-500 hover:text-red-600 font-bold text-xs gap-1.5 h-10">
              <FilterX className="w-4 h-4" /> مسح الكل
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button className="h-10 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-black text-xs gap-2 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4" /> طلب إجازة جديد
            </Button>
          </div>
        </div>

        {/* Placeholder Table Content */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs py-24 text-center">
           <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              <Calendar className="w-8 h-8" />
           </div>
           <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">سجل طلبات الإجازات</h3>
           <p className="text-xs text-slate-400 max-w-xs mx-auto">سيتم عرض قائمة طلبات الموظفين هنا للمراجعة والاعتماد.</p>
        </div>

      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'emerald' | 'amber' | 'red' | 'blue' }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex items-center gap-4 shadow-xs">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-black text-slate-400 block mb-0.5 uppercase tracking-wider">{label}</span>
        <span className={`text-xl font-black ${colors[color].split(' ')[1]}`}>{value}</span>
      </div>
    </div>
  );
}
