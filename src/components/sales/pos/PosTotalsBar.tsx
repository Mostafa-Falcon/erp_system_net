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
    <div className="bg-[#0b1329] text-white px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg shrink-0">
      {/* Right: الأصناف */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400">الأصناف:</span>
        <span className="text-2xl font-black text-white font-mono">{cartCount}</span>
      </div>

      {/* Center: التفاصيل المحاسبية */}
      <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-slate-400">الإجمالي قبل الخصم:</span>
          <span className="text-base font-black text-slate-200 font-mono">
            {subtotal.toFixed(2)} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </span>
        </div>

        {/* إجمالي الخصومات */}
        <button
          type="button"
          onClick={onOpenDiscountsModal}
          title="اضغط لتعديل وإضافة خصومات الفاتورة والأصناف"
          className="flex items-baseline gap-2 group hover:bg-slate-800/80 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-transparent hover:border-amber-500/30"
        >
          <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-400" />
            <span>إجمالي الخصومات:</span>
          </span>
          <span className="text-base font-black text-amber-400 font-mono group-hover:underline">
            {totalDiscount.toFixed(2)} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </span>
        </button>

        {/* ضريبة القيمة المضافة إن وجدت */}
        {totalTax > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-400">ضريبة:</span>
            <span className="text-base font-black text-slate-300 font-mono">
              +{totalTax.toFixed(2)} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </span>
          </div>
        )}

        {/* مصاريف الشحن إن وجدت */}
        {shippingFee > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              <span>توصيل:</span>
            </span>
            <span className="text-base font-black text-emerald-400 font-mono">
              +{shippingFee.toFixed(2)} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </span>
          </div>
        )}
      </div>

      {/* Left: الصافي النهائي أو قيمة المرتجع البارز */}
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-black text-slate-300">
          {isReturnMode ? 'قيمة المرتجع:' : 'الصافي النهائي:'}
        </span>
        <span
          className={`text-2xl sm:text-3xl font-black font-mono tracking-tight drop-shadow-sm ${
            isReturnMode ? 'text-[#f59e0b]' : 'text-[#00e5a3]'
          }`}
        >
          {total.toFixed(2)}{' '}
          <span className={`text-sm font-bold ${isReturnMode ? 'text-amber-300' : 'text-emerald-300'}`}>
            ج.م
          </span>
        </span>
      </div>
    </div>
  );
}
