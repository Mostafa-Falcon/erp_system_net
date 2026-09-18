'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { TrendingUp, PieChart, Calculator, BadgePercent } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSessionStore } from '@/core/state/useSessionStore';
import { DashboardRepository } from '@/core/pharmacy/dashboard_repository';
import { piastersToEgp } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

const toLocalISO = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ReportData {
  total_sales_piasters: number;
  sales_discounts_piasters: number;
  net_sales_piasters: number;
  total_purchases_piasters: number;
  total_expenses_piasters: number;
  gross_profit_piasters: number;
  net_profit_piasters: number;
}

const initialData: ReportData = {
  total_sales_piasters: 0,
  sales_discounts_piasters: 0,
  net_sales_piasters: 0,
  total_purchases_piasters: 0,
  total_expenses_piasters: 0,
  gross_profit_piasters: 0,
  net_profit_piasters: 0,
};

export default function ReportsPage() {
  const { session, activeBranchId } = useSessionStore();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(toLocalISO(monthStart));
  const [to, setTo] = useState(toLocalISO(today));
  const [data, setData] = useState<ReportData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !activeBranchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const report = await DashboardRepository.profitLoss(
        session.accountId,
        activeBranchId,
        new Date(from + 'T00:00:00').toISOString(),
        new Date(to + 'T23:59:59').toISOString()
      );
      if (!report) {
        setError('اختر فرعاً أولاً لعرض التقرير.');
        return;
      }
      const picked: ReportData = {
        total_sales_piasters: report.total_sales_piasters ?? 0,
        sales_discounts_piasters: report.sales_discounts_piasters ?? 0,
        net_sales_piasters: report.net_sales_piasters ?? 0,
        total_purchases_piasters: report.total_purchases_piasters ?? 0,
        total_expenses_piasters: report.total_expenses_piasters ?? 0,
        gross_profit_piasters: report.gross_profit_piasters ?? 0,
        net_profit_piasters: report.net_profit_piasters ?? 0,
      };
      setData(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر توليد التقرير.');
    } finally {
      setIsLoading(false);
    }
  }, [session, activeBranchId, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const reportCards: Array<{ label: string; value: string; tone: string; icon: React.ReactNode }> = [
    { label: 'إجمالي المبيعات', value: fmt(data.total_sales_piasters), tone: 'text-sky-600 dark:text-sky-400', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'الخصومات', value: fmt(data.sales_discounts_piasters), tone: 'text-slate-500', icon: <BadgePercent className="w-5 h-5" /> },
    { label: 'صافي المبيعات', value: fmt(data.net_sales_piasters), tone: 'text-emerald-600 dark:text-emerald-400', icon: <Calculator className="w-5 h-5" /> },
    { label: 'المشتريات', value: fmt(data.total_purchases_piasters), tone: 'text-indigo-600 dark:text-indigo-400', icon: <PieChart className="w-5 h-5" /> },
    { label: 'المصروفات', value: fmt(data.total_expenses_piasters), tone: 'text-amber-600 dark:text-amber-400', icon: <PieChart className="w-5 h-5" /> },
    { label: 'مجمل الربح', value: fmt(data.gross_profit_piasters), tone: 'text-emerald-600 dark:text-emerald-400', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <AppShell
      title="التقارير"
      subtitle="تقرير الأرباح والخسائر"
    >
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-3">
          <div className="space-y-2 flex-1">
            <Label className="text-right block text-xs font-bold">من</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2 flex-1">
            <Label className="text-right block text-xs font-bold">إلى</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <Button onClick={load} disabled={isLoading} className="gap-2 rounded-xl">
            {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            توليد التقرير
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reportCards.map((c) => (
          <Card key={c.label} className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <span className={cn('w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#090e1a] flex items-center justify-center', c.tone)}>
                {c.icon}
              </span>
              <div>
                <div className="text-[11px] font-bold text-slate-400">{c.label}</div>
                <div className={cn('text-lg font-black', c.tone)}>{c.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={cn('border-2 overflow-hidden', data.net_profit_piasters >= 0 ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-rose-200 dark:border-rose-900/60')}>
        <CardContent className={cn('p-6 flex flex-col sm:flex-row items-center justify-between gap-4', data.net_profit_piasters >= 0 ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-rose-50/60 dark:bg-rose-950/20')}>
          <div className="flex items-center gap-3">
            <span className={cn('w-12 h-12 rounded-2xl flex items-center justify-center',
              data.net_profit_piasters >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}>
              <TrendingUp className="w-6 h-6" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">صافي الربح / الخسارة</div>
              <div className={cn('text-sm font-semibold text-slate-400')}>
                {data.net_profit_piasters >= 0 ? 'ربح صافٍ خلال الفترة' : 'خسارة خلال الفترة'}
              </div>
            </div>
          </div>
          <div className={cn('text-3xl font-black', data.net_profit_piasters >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {fmt(data.net_profit_piasters)}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}