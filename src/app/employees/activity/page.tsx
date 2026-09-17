'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { History, Search, FilterX, User, Download, Calendar, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivityLogPage() {
  return (
    <AppShell
      title="سجل النشاطات"
      subtitle="سجل تدقيق كامل لكافة حركات المستخدمين على النظام لضمان الأمان والرقابة."
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="عمليات اليوم" value={142} icon={<History className="w-6 h-6" />} color="blue" isNumber />
          <StatCard label="عمليات حساسة" value={8} icon={<ShieldCheck className="w-6 h-6" />} color="red" isNumber />
          <StatCard label="مستخدمون نشطون" value={12} icon={<User className="w-6 h-6" />} color="emerald" isNumber />
          <StatCard label="فترة السجل" value="30 يوم" icon={<Calendar className="w-6 h-6" />} color="indigo" />
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative group w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="بحث في السجلات..."
                className="h-10 pr-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              />
            </div>

            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-xs font-bold">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العمليات</SelectItem>
                <SelectItem value="auth">تسجيل الدخول</SelectItem>
                <SelectItem value="sales">المبيعات</SelectItem>
                <SelectItem value="inventory">المخزون</SelectItem>
                <SelectItem value="delete">حذف بيانات</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" className="text-red-500 hover:text-red-600 font-bold text-xs gap-1.5 h-10">
              <FilterX className="w-4 h-4" /> مسح الكل
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 rounded-xl">
              <Download className="w-4 h-4 text-emerald-600" /> تصدير السجل
            </Button>
          </div>
        </div>

        {/* Audit Log Timeline Placeholder */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">سجل تدقيق النظام (Audit Log)</h3>
           </div>

           <div className="p-8 space-y-4">
              <LogItem user="محمد إبراهيم" action="إضافة صنف جديد" entity="بنادول إكسترا" time="قبل 5 دقائق" type="create" />
              <LogItem user="سارة أحمد" action="إصدار فاتورة مبيعات" entity="INV-E9-000821" time="قبل 12 دقيقة" type="create" />
              <LogItem user="أحمد علي" action="تعديل سعر شراء" entity="حقنة هيبارين" time="قبل 24 دقيقة" type="update" />
              <LogItem user="محمد إبراهيم" action="فتح وردية كاشير" entity="الوردية رقم 142" time="قبل ساعة" type="auth" />
              <LogItem user="النظام" action="مزامنة سحابية ناجحة" entity="Supabase Sync" time="قبل ساعتين" type="system" />
           </div>

           <div className="p-4 bg-slate-50/30 border-t border-slate-100 dark:border-slate-800 text-center">
              <Button variant="ghost" className="text-[11px] font-black text-blue-600">عرض المزيد من السجلات</Button>
           </div>
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
        <span className={`text-xl font-black ${colors[color].split(' ')[1]}`}>{value}</span>
      </div>
    </div>
  );
}

function LogItem({ user, action, entity, time, type }: { user: string, action: string, entity: string, time: string, type: 'create' | 'update' | 'delete' | 'auth' | 'system' }) {
  const typeStyles = {
    create: 'bg-emerald-500',
    update: 'bg-blue-500',
    delete: 'bg-red-500',
    auth: 'bg-indigo-500',
    system: 'bg-slate-400',
  };

  return (
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
       <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", typeStyles[type])} />
       <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
             <span className="text-xs font-black text-slate-900 dark:text-white">{user}</span>
             <span className="text-[10px] font-bold text-slate-400 font-mono">{time}</span>
          </div>
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
             {action}: <span className="text-blue-600 font-black">{entity}</span>
          </div>
       </div>
    </div>
  );
}
