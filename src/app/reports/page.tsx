'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';

const reports: Array<{ href: string; title: string; desc: string; icon: React.ReactNode }> = [
  {
    href: '/reports/profit-loss',
    title: 'الأرباح والخسائر',
    desc: 'تقرير شامل عن المبيعات والمشتريات والمصروفات وصافي الربح لفترة محددة.',
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

export default function ReportsHubPage() {
  return (
    <AppShell title="التقارير" subtitle="اختر تقريراً للبدء">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="group">
            <Card className="border-slate-200/80 dark:border-slate-800 transition-colors group-hover:border-violet-400 dark:group-hover:border-violet-600">
              <CardContent className="p-5 flex flex-col gap-3">
                <span className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  {r.icon}
                </span>
                <div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100">{r.title}</div>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1">{r.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-violet-600 dark:text-violet-400">
                  فتح التقرير <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
        <CardContent className="p-6 flex flex-col items-center gap-2 text-slate-400">
          <BarChart3 className="w-8 h-8" />
          <span className="text-xs font-bold">المزيد من التقارير قيد التطوير (المبيعات التفصيلية، المخزون، العملاء، الأطباء).</span>
        </CardContent>
      </Card>
    </AppShell>
  );
}