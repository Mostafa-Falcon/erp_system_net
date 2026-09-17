'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserCog, Lock, Key, Plus, Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PermissionsPage() {
  return (
    <AppShell
      title="مصفوفة الصلاحيات"
      subtitle="إدارة أدوار المستخدمين، مجموعات الصلاحيات، والتحكم في الوصول لصفحات النظام."
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button className="h-11 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-black text-sm gap-2 shadow-sm">
              <Plus className="w-5 h-5" /> إنشاء دور جديد (Role)
            </Button>
            <Button variant="outline" className="h-11 border-slate-200 dark:border-slate-800 font-bold text-sm gap-2 rounded-xl">
              <UserCog className="w-5 h-5 text-slate-400" /> إدارة المجموعات
            </Button>
          </div>

          <div className="relative group w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="بحث في الأدوار..."
              className="h-11 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <RoleCard name="صاحب المنشأة (Super Admin)" permissions="كافة الصلاحيات" users={1} isSystem />
           <RoleCard name="مدير الفرع (Branch Manager)" permissions="إدارة المبيعات، الموظفين، والمخزن" users={2} />
           <RoleCard name="كاشير (POS User)" permissions="عمليات البيع، الورديات، المرتجعات" users={8} />
           <RoleCard name="محاسب (Accountant)" permissions="القيود، السندات، الحسابات الختامية" users={2} />
           <RoleCard name="أمين مخزن (Warehouse)" permissions="التحويلات، الجرد، استلام المشتريات" users={2} />
        </div>

        {/* Permissions Matrix Placeholder */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                 <ShieldCheck className="w-5 h-5 text-blue-600" />
                 <h3 className="text-sm font-black text-slate-900 dark:text-white">مصفوفة التحكم في الوصول</h3>
              </div>
              <Button variant="ghost" className="text-xs font-bold text-slate-400 gap-1.5">
                تخصيص متقدم <ChevronDown className="w-4 h-4" />
              </Button>
           </div>

           <div className="p-20 text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300">
                 <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">إعدادات الأمان والوصول</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                يمكنك من خلال هذه الواجهة تخصيص صلاحيات كل دور بدقة متناهية على مستوى كل صفحة وكل إجراء (إضافة، تعديل، حذف، طباعة).
              </p>
           </div>
        </div>

      </div>
    </AppShell>
  );
}

function RoleCard({ name, permissions, users, isSystem = false }: { name: string, permissions: string, users: number, isSystem?: boolean }) {
  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-sm">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isSystem ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
                {isSystem ? <Key className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
             </div>
             <h4 className="text-xs font-black text-slate-900 dark:text-white">{name}</h4>
          </div>
          {isSystem && <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-lg border border-emerald-100">نظامي</span>}
       </div>

       <p className="text-[10px] font-bold text-slate-400 mb-4 line-clamp-1">{permissions}</p>

       <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{users} مستخدم</span>
          <Button variant="ghost" className="h-8 text-[10px] font-black text-blue-600 hover:bg-blue-50 px-2 rounded-lg">تعديل الصلاحيات</Button>
       </div>
    </div>
  );
}
