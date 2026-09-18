'use client';

import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MODULE_TITLES: Record<string, string> = {
  pos: 'نقطة البيع',
  shifts: 'الورديات',
  returns: 'المرتجعات',
  adjustments: 'التسويات',
  transfers: 'التحويلات',
  audits: 'الجرد',
  damages: 'التوالف',
  orders: 'أوامر الشراء',
  vouchers: 'سندات الدفع',
  journal: 'قيود اليومية',
  employees: 'الموظفون',
  attendance: 'الحضور',
  payroll: 'الرواتب',
  leaves: 'الإجازات',
  'profit-loss': 'الأرباح والخسائر',
};

export default function CatchAllPlaceholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const [slug, setSlug] = React.useState<string[]>([]);
  React.useEffect(() => {
    params.then((p) => setSlug(p.slug)).catch(() => {});
  }, [params]);

  const last = slug[slug.length - 1] ?? '';
  const title = MODULE_TITLES[last] ?? 'الوحدة';

  return (
    <AppShell title={title} subtitle="قيد التطوير">
      <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
        <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
          <span className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Construction className="w-7 h-7" />
          </span>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">وحدة {title} قيد التطوير</h2>
          <p className="text-xs font-semibold text-slate-400 max-w-md leading-relaxed">
            هذه الوحدة ضمن خارطة الطريق التالية. الوحدات المكتملة حالياً: لوحة التحكم، الأدوية، الباتشات،
            العملاء، الموردون، الأطباء، فواتير البيع والشراء، الخزائن، المصروفات، دليل الحسابات، الإعدادات، والتقارير.
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2 mt-2 rounded-xl">
              <ArrowRight className="w-4 h-4" /> العودة للوحة التحكم
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}