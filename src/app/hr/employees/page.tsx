'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataColumn, PagedTablePage } from '@/components/data/PagedTablePage';
import { HrRepository } from '@/core/pharmacy/hr_repository';
import type { PharmacyUser } from '@/types/pharmacy';

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالك',
  admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  cashier: 'كاشير',
  employee: 'موظف',
  warehouse_keeper: 'أمين مخزن',
};

const ROLE_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline' | 'default'> = {
  owner: 'default',
  admin: 'destructive',
  manager: 'success',
  accountant: 'warning',
  cashier: 'success',
  employee: 'outline',
  warehouse_keeper: 'warning',
};

const columns: DataColumn<PharmacyUser>[] = [
  {
    key: 'user',
    header: 'الموظف',
    render: (row) => (
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{row.name}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate" dir="ltr">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'الدور',
    render: (row) => (
      <Badge variant={ROLE_VARIANT[row.role] ?? 'outline'}>{ROLE_LABELS[row.role] ?? row.role}</Badge>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) =>
      row.is_active ? <Badge variant="success">نشط</Badge> : <Badge variant="destructive">موقوف</Badge>,
  },
];

export default function EmployeesPage() {
  return (
    <PagedTablePage<PharmacyUser>
      title="الموظفون"
      subtitle="مستخدمي النظام وصلاحياتهم"
      searchPlaceholder="ابحث بالاسم أو البريد الإلكتروني..."
      columns={columns}
      getRowId={(row) => row.id}
      fetcher={({ branchId, search, page, pageSize }) =>
        HrRepository.listEmployees({ branchId, search, page, pageSize })
      }
    />
  );
}