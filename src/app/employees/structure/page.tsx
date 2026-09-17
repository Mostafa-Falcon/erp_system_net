'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Building2, FolderTree, Users, Layers, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function StructurePage() {
  return (
    <AppShell
      title="الهيكل والأقسام"
      subtitle="إدارة الهيكل التنظيمي للمنشأة، الفروع، والأقسام الإدارية والتشغيلية."
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm gap-2 shadow-sm">
              <Plus className="w-5 h-5" /> إضافة قسم جديد
            </Button>
            <Button variant="outline" className="h-11 border-slate-200 dark:border-slate-800 font-bold text-sm gap-2 rounded-xl">
              <FolderTree className="w-5 h-5 text-slate-400" /> عرض الشجرة
            </Button>
          </div>

          <div className="relative group w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="بحث في الأقسام..."
              className="h-11 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        {/* Structure Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Summary Sidebar */}
           <div className="space-y-4">
              <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">ملخص الهيكل</h3>
                    <p className="text-[10px] font-bold text-slate-400">إحصائيات الأقسام والموظفين</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <SummaryItem label="إجمالي الأقسام" value={4} icon={<Layers className="w-4 h-4" />} />
                  <SummaryItem label="إجمالي الموظفين" value={15} icon={<Users className="w-4 h-4" />} />
                </div>
              </div>
           </div>

           {/* Main Content Areas */}
           <div className="md:col-span-2 space-y-4">
              <DepartmentCard name="الإدارة العامة" manager="المدير العام" count={3} color="blue" />
              <DepartmentCard name="قسم المبيعات" manager="مدير المبيعات" count={6} color="emerald" />
              <DepartmentCard name="قسم المشتريات والمخازن" manager="أمين المخزن الرئيسي" count={4} color="amber" />
              <DepartmentCard name="قسم المحاسبة" manager="المحاسب المالي" count={2} color="indigo" />
           </div>
        </div>

      </div>
    </AppShell>
  );
}

function SummaryItem({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function DepartmentCard({ name, manager, count, color }: { name: string, manager: string, count: number, color: 'blue' | 'emerald' | 'amber' | 'indigo' }) {
  const colors = {
    blue: 'border-blue-100 bg-blue-50/20 text-blue-600',
    emerald: 'border-emerald-100 bg-emerald-50/20 text-emerald-600',
    amber: 'border-amber-100 bg-amber-50/20 text-amber-600',
    indigo: 'border-indigo-100 bg-indigo-50/20 text-indigo-600',
  };

  return (
    <div className={cn("flex items-center justify-between p-5 rounded-2xl border shadow-xs transition-all hover:shadow-sm", colors[color])}>
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", colors[color].split(' ')[0], colors[color].split(' ')[1])}>
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">{name}</h4>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">المدير المسئول: {manager}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase">الموظفين</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">{count}</span>
        </div>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/50 text-slate-400">
           <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
