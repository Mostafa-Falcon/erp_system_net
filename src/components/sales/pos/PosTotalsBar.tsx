import React from 'react';
import { Tag, Truck } from 'lucide-react';

interface PosTotalsBarProps {
  cartCount: number;
  subtotal: number;
  totalDiscount: number;
  shippingFee?: number;
  totalTax?: number;
  total: number;
  isReturnMode?: boolean;
  onOpenDiscountsModal?: () => void;
}

export function PosTotalsBar({
  cartCount,
  subtotal,
  totalDiscount,
  shippingFee = 0,
  totalTax = 0,
  total,
  isReturnMode = false,
  onOpenDiscountsModal,
}: PosTotalsBarProps) {
  return (
    <div className="bg-[#0b1329] text-white px-3 sm:px-6 py-2 sm:py-3 border-t border-slate-800 shadow-lg shrink-0 select-none">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
        {/* Mobile top row / Desktop right group */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 flex-wrap">
          {/* الأصناف */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-700/50">
            <span className="text-[11px] font-bold text-slate-400">الأصناف:</span>
            <span className="text-sm sm:text-base font-black text-white font-mono">{cartCount}</span>
          </div>

          {/* التفاصيل المحاسبية */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden xs:flex items-baseline gap-1 text-slate-400 text-xs">
              <span className="font-semibold text-[11px]">قبل الخصم:</span>
              <span className="font-bold text-slate-200 font-mono">
                {subtotal.toFixed(2)}
              </span>
            </div>

            {/* إجمالي الخصومات */}
            <button
              type="button"
              onClick={onOpenDiscountsModal}
              title="اضغط لتعديل وإضافة خصومات الفاتورة والأصناف"
              className="flex items-center gap-1 group hover:bg-slate-800/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-amber-500/30 text-amber-400"
            >
              <Tag className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] font-bold">خصم:</span>
              <span className="text-xs sm:text-sm font-black font-mono">
                {totalDiscount.toFixed(2)}
              </span>
            </button>

            {/* ضريبة القيمة المضافة إن وجدت */}
            {totalTax > 0 && (
              <div className="hidden sm:flex items-baseline gap-1 text-xs text-slate-400">
                <span className="font-semibold text-[11px]">ضريبة:</span>
                <span className="font-bold text-slate-300 font-mono">+{totalTax.toFixed(2)}</span>
              </div>
            )}

            {/* مصاريف الشحن إن وجدت */}
            {shippingFee > 0 && (
              <div className="hidden sm:flex items-baseline gap-1 text-xs text-emerald-400">
                <Truck className="w-3 h-3" />
                <span className="font-bold font-mono">+{shippingFee.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* الصافي النهائي أو قيمة المرتجع البارز */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-slate-800/80 pt-1.5 sm:pt-0">
          <span className="text-xs font-black text-slate-300 sm:hidden">
            {isReturnMode ? 'قيمة المرتجع:' : 'الصافي النهائي:'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="hidden sm:inline text-xs font-black text-slate-300">
              {isReturnMode ? 'قيمة المرتجع:' : 'الصافي:'}
            </span>
            <span
              className={`text-xl sm:text-3xl font-black font-mono tracking-tight drop-shadow-sm ${
                isReturnMode ? 'text-[#f59e0b]' : 'text-[#00e5a3]'
              }`}
            >
              {total.toFixed(2)}{' '}
              <span className={`text-xs sm:text-sm font-bold ${isReturnMode ? 'text-amber-300' : 'text-emerald-300'}`}>
                ج.م
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
