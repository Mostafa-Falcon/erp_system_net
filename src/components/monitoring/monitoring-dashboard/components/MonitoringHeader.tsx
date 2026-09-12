import React from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';

interface MonitoringHeaderProps {
  dateRange: string;
  setDateRange: (range: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loading: boolean;
  refreshData: () => void;
}

export const MonitoringHeader: React.FC<MonitoringHeaderProps> = ({
  dateRange,
  setDateRange,
  selectedDate,
  setSelectedDate,
  loading,
  refreshData,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
          لوحة المتابعة
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          نظرة تحليلية شاملة ومباشرة على أداء المنشأة والمبيعات والمخزون
        </p>
      </div>

      {/* Action Controls: Date Picker & Period Filter */}
      <div className="flex items-center gap-2.5">
        {/* Refresh Button */}
        <button
          onClick={refreshData}
          disabled={loading}
          className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">تحديث</span>
        </button>

        {/* Calendar Picker Button */}
        <div className="relative">
          <button
            onClick={() => {
              const el = document.getElementById('monitoring-date-input') as HTMLInputElement;
              if (el) el.showPicker ? el.showPicker() : el.focus();
            }}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedDate ? `تاريخ: ${selectedDate}` : 'تحديد يوم معين'}</span>
          </button>
          <input
            id="monitoring-date-input"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="sr-only"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 text-[10px] font-bold flex items-center justify-center cursor-pointer"
              title="إلغاء التحديد"
            >
              ✕
            </button>
          )}
        </div>

        {/* Period Dropdown Select */}
        <div className="relative">
          <select
            value={dateRange}
            disabled={!!selectedDate}
            onChange={(e) => setDateRange(e.target.value)}
            className={`h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs appearance-none cursor-pointer ${
              selectedDate ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="اليوم">اليوم</option>
            <option value="أمس">أمس</option>
            <option value="آخر 7 أيام">آخر 7 أيام</option>
            <option value="آخر 30 يوم">آخر 30 يوم</option>
            <option value="هذا الشهر">هذا الشهر</option>
            <option value="هذا العام">هذا العام</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
