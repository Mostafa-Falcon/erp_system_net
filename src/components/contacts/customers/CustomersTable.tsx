'use client';

import React from 'react';
import { RefreshCw, Users, MoreVertical, Eye, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types';
import type { CustomerColumnConfig } from './ColumnsCustomizerModal';

interface CustomersTableProps {
  customers: Contact[];
  salesTotals: Record<string, number>;
  isLoading: boolean;
  columns: CustomerColumnConfig;
  onViewDetails: (customer: Contact) => void;
  onEdit: (customer: Contact) => void;
  onToggleActive: (customer: Contact) => void;
}

export function CustomersTable({
  customers,
  salesTotals,
  isLoading,
  columns,
  onViewDetails,
  onEdit,
  onToggleActive,
}: CustomersTableProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-pink-600" />
        <span className="text-xs font-bold">جاري تحميل سجل العملاء...</span>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Users className="w-14 h-14 mx-auto mb-3 opacity-25" />
        <p className="font-black text-slate-700 dark:text-slate-300 text-sm">لا يوجد عملاء مطابقين لخيارات البحث</p>
        <p className="text-xs text-slate-400 mt-1">جرب مسح الفلتر أو إضافة عميل جديد للبدء.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
            {columns.code && <th className="py-4 px-5">معرف الاتصال</th>}
            {columns.name && <th className="py-4 px-4">اسم العميل / المشروع</th>}
            {columns.phone && <th className="py-4 px-4">رقم الهاتف</th>}
            {columns.purchases && <th className="py-4 px-4 text-left">المجموع (المسحوبات)</th>}
            {columns.balance && <th className="py-4 px-4 text-left">الرصيد الحالي</th>}
            {columns.lastActivity && <th className="py-4 px-4 text-center">آخر حركة / تاريخ</th>}
            <th className="py-4 px-5 text-center w-16">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold">
          {customers.map((c) => {
            const totalPurchased = salesTotals[c.id] || 0;
            const isDebit = c.current_balance > 0;
            const isCredit = c.current_balance < 0;

            return (
              <tr
                key={c.id}
                className={cn(
                  "hover:bg-pink-50/20 dark:hover:bg-pink-950/10 transition-colors group",
                  !c.is_active && "opacity-50 bg-slate-50/40 dark:bg-slate-900/30"
                )}
              >
                {/* معرف الاتصال */}
                {columns.code && (
                  <td className="py-4 px-5 font-mono text-slate-400 text-xs">
                    {c.code || '—'}
                  </td>
                )}

                {/* اسم العميل / المشروع */}
                {columns.name && (
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <button
                          onClick={() => onViewDetails(c)}
                          className="font-black text-slate-900 dark:text-white hover:text-pink-600 transition-colors text-right cursor-pointer"
                        >
                          {c.name}
                        </button>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          تصنيف عام {c.type === 'both' && '• عميل ومورد'}
                        </span>
                      </div>
                    </div>
                  </td>
                )}

                {/* رقم الهاتف */}
                {columns.phone && (
                  <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                    {c.phone || c.mobile ? (
                      <a href={`tel:${c.phone || c.mobile}`} className="hover:text-blue-600 transition-colors">
                        {c.phone || c.mobile}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                )}

                {/* المجموع (المسحوبات) */}
                {columns.purchases && (
                  <td className="py-4 px-4 text-left font-black font-mono text-slate-700 dark:text-slate-300">
                    {formatNumber(totalPurchased)} ج.م
                  </td>
                )}

                {/* الرصيد الحالي */}
                {columns.balance && (
                  <td className="py-4 px-4 text-left font-black font-mono">
                    <span
                      className={cn(
                        "text-sm",
                        isDebit && "text-rose-600 dark:text-rose-400",
                        isCredit && "text-emerald-600 dark:text-emerald-400",
                        c.current_balance === 0 && "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {formatNumber(c.current_balance)} ج.م
                    </span>
                  </td>
                )}

                {/* تاريخ الإضافة / آخر حركة */}
                {columns.lastActivity && (
                  <td className="py-4 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {new Date(c.created_at).toLocaleDateString('en-CA')}
                  </td>
                )}

                {/* إجراءات (القائمة المنسدلة ثلاث نقاط) */}
                <td className="py-4 px-5 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mx-auto">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-2xl p-1.5 shadow-xl border-slate-200 dark:border-slate-800">
                      <DropdownMenuItem
                        onClick={() => onViewDetails(c)}
                        className="flex items-center gap-2.5 py-2 px-3 text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-950/40"
                      >
                        <Eye className="w-4 h-4" />
                        <span>التفاصيل</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onEdit(c)}
                        className="flex items-center gap-2.5 py-2 px-3 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 text-slate-700 dark:text-slate-300"
                      >
                        <Edit className="w-4 h-4" />
                        <span>تعديل</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onToggleActive(c)}
                        className={cn(
                          "flex items-center gap-2.5 py-2 px-3 text-xs font-bold rounded-xl cursor-pointer",
                          c.is_active
                            ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        )}
                      >
                        {c.is_active ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{c.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
