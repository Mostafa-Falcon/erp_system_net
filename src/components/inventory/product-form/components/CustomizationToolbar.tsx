import React from 'react';
import { SlidersHorizontal, FileText, Settings, Clock, Check } from 'lucide-react';

interface CustomizationToolbarProps {
  showSpecs: boolean;
  setShowSpecs: (val: boolean) => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  showExpiry: boolean;
  setShowExpiry: (val: boolean) => void;
  setEnableExpiryTracking: (val: boolean) => void;
}

export const CustomizationToolbar: React.FC<CustomizationToolbarProps> = ({
  showSpecs,
  setShowSpecs,
  showAdvanced,
  setShowAdvanced,
  showExpiry,
  setShowExpiry,
  setEnableExpiryTracking,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <span>تخصيص واجهة الإدخال:</span>
        </div>

        {/* تبديل: المواصفات الإضافية (Default: false) */}
        <button
          type="button"
          onClick={() => setShowSpecs(!showSpecs)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            showSpecs
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>المواصفات الإضافية</span>
          {showSpecs && <Check className="w-3 h-3" />}
        </button>

        {/* تبديل: الإعدادات المتقدمة (Default: false) */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            showAdvanced
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>الإعدادات المتقدمة</span>
          {showAdvanced && <Check className="w-3 h-3" />}
        </button>

        {/* تبديل: تتبع الصلاحية (Default: false) */}
        <button
          type="button"
          onClick={() => {
            const next = !showExpiry;
            setShowExpiry(next);
            setEnableExpiryTracking(next);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            showExpiry
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>تتبع الصلاحية</span>
          {showExpiry && <Check className="w-3 h-3" />}
        </button>
      </div>

      <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
        قم بتفعيل ما تحتاجه فقط لتبسيط وتسريع عملية الإدخال
      </p>
    </div>
  );
};
