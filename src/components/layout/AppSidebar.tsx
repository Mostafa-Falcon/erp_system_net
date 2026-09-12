'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';

interface AppSidebarProps {
  isOpen: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: { label: string; href: string }[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen }) => {
  const pathname = usePathname();
  const { currentUser, activeBranchId } = useSessionStore();
  const [orgName, setOrgName] = useState('لوجيسكا ERP');
  const [orgActivity, setOrgActivity] = useState('منظومة الإدارة وتخطيط الموارد');
  const [branchName, setBranchName] = useState('الفرع الرئيسي');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const orgId = currentUser?.org_id;
    if (!orgId) return;

    Promise.resolve()
      .then(async () => {
        const { db } = await import('@/core/db/app_database');
        
        // 1. Organization details
        const org = await db.organizations.get(orgId);
        if (org) {
          if (org.name) setOrgName(org.name);
          if (org.legal_name) setOrgActivity(org.legal_name);
        }

        // 2. Branch details
        const bid = activeBranchId || currentUser?.branch_id;
        if (bid) {
          const branch = await db.branches.get(bid);
          if (branch) {
            setBranchName(branch.name);
            return;
          }
        }
        const main = await db.branches.where('org_id').equals(orgId).and((b) => b.is_main).first();
        if (main) setBranchName(main.name);
      })
      .catch(() => {
        setBranchName('الفرع الرئيسي');
      });
  }, [currentUser, activeBranchId]);

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: <Icons.Home />,
      href: '/',
    },
    {
      id: 'monitoring',
      label: 'لوحة المتابعة',
      icon: <Icons.Monitoring />,
      href: '/monitoring',
    },
    {
      id: 'items',
      label: 'الأصناف',
      icon: <Icons.Items />,
      subItems: [
        { label: 'دليل الأصناف', href: '/items' },
        { label: 'إضافة صنف جديد', href: '/items/new' },
        { label: 'طباعة الباركود', href: '/items/barcode' },
        { label: 'المراجع (فئات ووحدات)', href: '/items/references' },
      ],
    },
    {
      id: 'sales',
      label: 'المبيعات',
      icon: <Icons.Sales />,
      subItems: [
        { label: 'نقطة البيع (POS)', href: '/sales/pos' },
        { label: 'فواتير المبيعات', href: '/sales/invoices' },
        { label: 'مرتجعات المبيعات', href: '/sales/returns' },
        { label: 'ورديات الكاشير', href: '/sales/shifts' },
      ],
    },
    {
      id: 'purchases',
      label: 'المشتريات',
      icon: <Icons.Purchases />,
      subItems: [
        { label: 'فواتير المشتريات', href: '/purchases/invoices' },
        { label: 'مرتجع مشتريات', href: '/purchases/returns' },
      ],
    },
    {
      id: 'inventory',
      label: 'المخزون',
      icon: <Icons.Warehouse />,
      subItems: [
        { label: 'حالة المخزون', href: '/inventory/status' },
        { label: 'تحويل مخزون', href: '/inventory/transfer' },
        { label: 'التوالف والتالف', href: '/inventory/damages' },
        { label: 'تحت حد الطلب', href: '/inventory/reorder' },
        { label: 'الرصيد الافتتاحي والتسويات', href: '/inventory/status?action=adjust' },
      ],
    },
    {
      id: 'contacts',
      label: 'العملاء والموردين',
      icon: <Icons.Contacts />,
      subItems: [
        { label: 'دليل العملاء', href: '/contacts/customers' },
        { label: 'دليل الموردين', href: '/contacts/suppliers' },
      ],
    },
    {
      id: 'employees',
      label: 'الموظفين والمستخدمين',
      icon: <Icons.Employees />,
      subItems: [
        { label: 'المستخدمين والصلاحيات', href: '/employees' },
      ],
    },
    {
      id: 'accounts',
      label: 'إدارة الحسابات',
      icon: <Icons.Accounts />,
      subItems: [
        { label: 'الخزائن والبنوك', href: '/accounts/treasuries' },
        { label: 'سندات القبض والصرف', href: '/accounts/vouchers' },
        { label: 'المصروفات', href: '/accounts/expenses' },
      ],
    },
    {
      id: 'reports',
      label: 'التقارير',
      icon: <Icons.Reports />,
      subItems: [
        { label: 'تقرير المبيعات والأرباح', href: '/reports/sales' },
        { label: 'حركة المخزون', href: '/reports/inventory' },
        { label: 'الانتهاء (الصلاحية)', href: '/reports/expiry' },
        { label: 'تقييم المخزون', href: '/reports/valuation' },
      ],
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <Icons.Settings />,
      subItems: [
        { label: 'إعدادات المؤسسة', href: '/settings' },
      ],
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  const filteredNavItems = navItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesItem = item.label.toLowerCase().includes(q);
    const matchesSub = item.subItems?.some((sub) => sub.label.toLowerCase().includes(q));
    return matchesItem || matchesSub;
  });

  return (
    <aside
      className="w-[260px] h-screen bg-white dark:bg-[#131b2e] border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 sticky top-0 z-40 transition-colors duration-200 select-none"
    >
      {/* Top Header & Search */}
      <div className="p-4 flex flex-col gap-4">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center text-white shadow-sm shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 dark:text-white text-base leading-tight tracking-wide">
              {orgName}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
              {orgActivity}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icons.Search />
          </div>
          <input
            id="sidebar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث... (Ctrl + K أو F4)"
            className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pr-9 pl-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>
      </div>

      {/* Nav Tree List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {filteredNavItems.map((item) => {
          // Direct Link Item (e.g. الرئيسية, لوحة المتابعة)
          if (item.href && !item.subItems) {
            const isCurrentActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isCurrentActive
                    ? 'bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#60a5fa] border-r-4 border-[#2563eb]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isCurrentActive ? 'text-[#2563eb] dark:text-[#60a5fa]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          }

          // Expandable Item with Subitems
          const hasActiveChild = item.subItems?.some((s) => pathname === s.href) || false;
          const isExpanded = !!expandedItems[item.id] || hasActiveChild;

          return (
            <div key={item.id} className="space-y-0.5">
              <div
                onClick={() => toggleExpand(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  hasActiveChild
                    ? 'bg-slate-100/80 dark:bg-slate-800/60 text-[#2563eb] dark:text-[#60a5fa]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={hasActiveChild ? 'text-[#2563eb] dark:text-[#60a5fa]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.subItems && (
                  <span className="text-slate-400 text-xs">
                    {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                  </span>
                )}
              </div>

              {/* Sub items */}
              {item.subItems && isExpanded && (
                <div className="pr-7 pl-2 py-1 space-y-1">
                  {item.subItems.map((sub, idx) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={idx}
                        href={sub.href}
                        className={`block py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors ${
                          isSubActive
                            ? 'text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-[#1e3a8a]/30 font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-[#2563eb] hover:bg-blue-50/40 dark:hover:bg-slate-800'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Branch Selector */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#16a34a] flex items-center justify-center">
              <Icons.Items />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">
                الفرع الحالي
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {branchName}
              </span>
            </div>
          </div>
          <span className="text-slate-400">
            <Icons.SwitchArrows />
          </span>
        </div>
      </div>
    </aside>
  );
};
