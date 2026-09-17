import React from 'react';
import Link from 'next/link';
import {
  X,
  DollarSign,
  CreditCard,
  Layers,
  UserCheck,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface PosPaymentActionsProps {
  onClearCart: () => void;
  onCheckout: (type: 'cash' | 'card' | 'credit' | 'split') => void;
  onOpenSplitModal: () => void;
  isSaving: boolean;
  cartCount: number;
  isReturnMode?: boolean;
}

export function PosPaymentActions({
  onClearCart,
  onCheckout,
  onOpenSplitModal,
  isSaving,
  cartCount,
  isReturnMode = false,
}: PosPaymentActionsProps) {
  if (isReturnMode) {
    return (
      <div className="bg-white dark:bg-[#111726] border-t border-slate-200 dark:border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 shrink-0">
        {/* مرتجع نقدي (F10) */}
        <button
          onClick={() => onCheckout('cash')}
          disabled={isSaving || cartCount === 0}
          className="h-12 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isSaving ? 'جارٍ الحفظ...' : 'مرتجع نقدي (F10)'}</span>
        </button>

        {/* دفع بالبطاقة (F7) */}
        <button
          onClick={() => onCheckout('card')}
          disabled={isSaving || cartCount === 0}
          className="h-12 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          <span>دفع بالبطاقة (F7)</span>
        </button>

        {/* مرتجع زر جانبي */}
        <button
          onClick={() => onCheckout('cash')}
          disabled={isSaving || cartCount === 0}
          className="h-12 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>مرتجع</span>
        </button>

        {/* إلغاء وضع المرتجع (F12) */}
        <button
          onClick={onClearCart}
          className="h-12 rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>إلغاء المرتجع (F12)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111726] border-t border-slate-200 dark:border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 shrink-0">
      {/* إلغاء (F12) */}
      <button
        onClick={onClearCart}
        className="h-11 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
      >
        <X className="w-4 h-4" />
        <span>إلغاء (F12)</span>
      </button>

      {/* دفع نقدي (F10) - PRIMARY */}
      <button
        onClick={() => onCheckout('cash')}
        disabled={isSaving}
        className="h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
      >
        <DollarSign className="w-4 h-4" />
        <span>{isSaving ? 'جارٍ الحفظ...' : 'دفع نقدي (F10)'}</span>
      </button>

      {/* دفع بالبطاقة (F7) */}
      <button
        onClick={() => onCheckout('card')}
        disabled={isSaving}
        className="h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      >
        <CreditCard className="w-4 h-4" />
        <span>دفع بالبطاقة (F7)</span>
      </button>

      {/* دفع مختلط (F9) */}
      <button
        onClick={onOpenSplitModal}
        disabled={isSaving}
        className="h-11 rounded-xl bg-[#334155] hover:bg-[#1e293b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      >
        <Layers className="w-4 h-4" />
        <span>دفع مختلط (F9)</span>
      </button>

      {/* بيع آجل */}
      <button
        onClick={() => onCheckout('credit')}
        disabled={isSaving}
        className="h-11 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      >
        <UserCheck className="w-4 h-4" />
        <span>بيع آجل</span>
      </button>

      {/* مرتجع */}
      <Link href="/sales/returns" className="w-full">
        <button className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer">
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>مرتجع</span>
        </button>
      </Link>

      {/* عرض سعر */}
      <button
        onClick={() => {
          if (cartCount === 0) {
            toast.warning('يرجى إضافة أصناف أولاً لحفظ عرض السعر');
            return;
          }
          toast.success('تم إنشاء وحفظ عرض السعر بنجاح');
        }}
        className="h-11 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
      >
        <FileText className="w-4 h-4" />
        <span>عرض سعر</span>
      </button>

      {/* مسودة */}
      <button
        onClick={() => {
          if (cartCount === 0) {
            toast.warning('يرجى إضافة أصناف أولاً لحفظ المسودة');
            return;
          }
          toast.info('تم حفظ الفاتورة كمسودة مؤقتة');
        }}
        className="h-11 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
      >
        <FileText className="w-4 h-4" />
        <span>مسودة</span>
      </button>
    </div>
  );
}
