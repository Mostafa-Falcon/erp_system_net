'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  Search,
  Printer
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ChartOfAccountsPage() {
  return (
    <AppShell
      title="شجرة الحسابات (COA)"
      subtitle="هيكل الحسابات المالي المنظم للمؤسسة (الأصول، الخصوم، الإيرادات، المصروفات)."
    >
      <div className="space-y-6 text-right" dir="rtl">

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs gap-2">
              <Plus className="w-4 h-4" /> إضافة حساب جديد
            </Button>
            <Button variant="outline" className="h-10 px-4 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs gap-2">
              <Printer className="w-4 h-4" /> طباعة الشجرة
            </Button>
          </div>

          <div className="relative group w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="بحث في الحسابات..."
              className="h-10 pr-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        {/* Simplified Tree View Placeholder */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-6 space-y-4">

            <AccountNode label="1. الأصول (Assets)" code="1000" type="parent" color="text-blue-600">
               <AccountNode label="11. الأصول المتداولة" code="1100" type="parent">
                  <AccountNode label="111. النقدية بالخزائن" code="1110" type="leaf" balance="63,818.75" />
                  <AccountNode label="112. حسابات البنوك" code="1120" type="leaf" balance="0.00" />
                  <AccountNode label="113. مخزون السلع" code="1130" type="leaf" balance="122,732.50" />
               </AccountNode>
            </AccountNode>

            <AccountNode label="2. الخصوم (Liabilities)" code="2000" type="parent" color="text-red-600">
               <AccountNode label="21. الخصوم المتداولة" code="2100" type="parent">
                  <AccountNode label="211. الموردين" code="2110" type="leaf" balance="5,400.00" />
               </AccountNode>
            </AccountNode>

            <AccountNode label="3. حقوق الملكية (Equity)" code="3000" type="parent" color="text-purple-600" />

            <AccountNode label="4. الإيرادات (Revenues)" code="4000" type="parent" color="text-emerald-600">
               <AccountNode label="41. إيرادات المبيعات" code="4100" type="leaf" balance="12,500.00" />
            </AccountNode>

            <AccountNode label="5. المصروفات (Expenses)" code="5000" type="parent" color="text-amber-600">
               <AccountNode label="51. تكلفة المبيعات (COGS)" code="5100" type="leaf" balance="8,200.00" />
               <AccountNode label="52. مصروفات تشغيلية" code="5200" type="leaf" balance="1,200.00" />
            </AccountNode>

          </div>
        </div>

      </div>
    </AppShell>
  );
}

function AccountNode({ label, code, type, children, balance, color }: { label: string, code: string, type: 'parent' | 'leaf', children?: React.ReactNode, balance?: string, color?: string }) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer group transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {type === 'parent' ? (
            isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : <div className="w-4" />}

          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-950 border border-slate-100'}`}>
            {type === 'parent' ? <FolderTree className={`w-4 h-4 ${color || 'text-slate-400'}`} /> : <Layers className="w-3.5 h-3.5 text-slate-400" />}
          </div>

          <div className="flex flex-col">
            <span className={`text-xs font-black ${color || 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{code}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {balance !== undefined && (
            <div className="text-left font-mono font-black text-xs text-blue-600">
              {balance} <span className="text-[9px] font-sans opacity-70">ج.م</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        </div>
      </div>

      {isOpen && children && (
        <div className="mr-8 pr-4 border-r border-slate-100 dark:border-slate-800 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
