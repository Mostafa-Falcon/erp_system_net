'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Activity, Package, ShoppingCart, ShoppingBag,
  Users, UserCheck, Landmark, BarChart3, Settings,
  ChevronDown, ChevronUp, Search, Store, ChevronsUpDown,
  Check, X,
} from 'lucide-react';
import { useSessionStore } from '@/core/state/useSessionStore';
import { LookupsRepository } from '@/core/pharmacy/lookups_repository';
import type { Branch } from '@/types/pharmacy';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubNavItem {
  label: string;
  href: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: SubNavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'الرئيسية',
    icon: Home,
    href: '/',
    subItems: [
      { label: 'لوحة المتابعة', href: '/' },
    ],
  },
  {
    id: 'items',
    label: 'الأصناف',
    icon: Package,
    subItems: [
      { label: 'دليل الأدوية والأصناف', href: '/medicines' },
      { label: 'الباتشات والصلاحية', href: '/inventory/batches' },
      { label: 'التسويات المخزنية', href: '/inventory/adjustments' },
      { label: 'تحويلات الفروع', href: '/inventory/transfers' },
      { label: 'محاضر الجرد', href: '/inventory/audits' },
      { label: 'التوالف والمنتهي', href: '/inventory/damages' },
    ],
  },
  {
    id: 'sales',
    label: 'المبيعات',
    icon: ShoppingCart,
    subItems: [
      { label: 'نقطة البيع (POS)', href: '/sales/pos' },
      { label: 'فواتير المبيعات', href: '/sales/invoices' },
      { label: 'مرتجعات المبيعات', href: '/sales/returns' },
      { label: 'إدارة الورديات', href: '/sales/shifts' },
      { label: 'عروض الأسعار', href: '/sales/invoices' },
    ],
  },
  {
    id: 'purchases',
    label: 'المشتريات',
    icon: ShoppingBag,
    subItems: [
      { label: 'فواتير المشتريات', href: '/purchases/invoices' },
      { label: 'أوامر الشراء', href: '/purchases/orders' },
      { label: 'مرتجعات المشتريات', href: '/purchases/returns' },
      { label: 'سجل الموردين', href: '/contacts/suppliers' },
    ],
  },
  {
    id: 'contacts',
    label: 'العملاء والموردين',
    icon: Users,
    subItems: [
      { label: 'سجل العملاء', href: '/contacts/customers' },
      { label: 'سجل الموردين', href: '/contacts/suppliers' },
      { label: 'الأطباء والعيادات', href: '/contacts/doctors' },
    ],
  },
  {
    id: 'employees',
    label: 'الموظفين والمستخدمين',
    icon: UserCheck,
    subItems: [
      { label: 'إدارة الموظفين', href: '/hr/employees' },
      { label: 'الحضور والانصراف', href: '/hr/attendance' },
      { label: 'الرواتب والمسيرات', href: '/hr/payroll' },
      { label: 'الإجازات', href: '/hr/leaves' },
    ],
  },
  {
    id: 'accounts',
    label: 'إدارة الحسابات',
    icon: Landmark,
    subItems: [
      { label: 'الخزائن والبنوك', href: '/treasury/treasuries' },
      { label: 'المصروفات التشغيلية', href: '/treasury/expenses' },
      { label: 'سندات القبض والصرف', href: '/treasury/vouchers' },
      { label: 'دليل الحسابات', href: '/accounting/chart-of-accounts' },
      { label: 'قيود اليومية', href: '/accounting/journal' },
    ],
  },
  {
    id: 'reports',
    label: 'التقارير',
    icon: BarChart3,
    subItems: [
      { label: 'الأرباح والخسائر', href: '/reports/profit-loss' },
      { label: 'تقرير المبيعات الشامل', href: '/sales/invoices' },
      { label: 'تقرير حركة المخزون', href: '/inventory/batches' },
    ],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Settings,
    subItems: [
      { label: 'إعدادات النظام العامة', href: '/settings' },
      { label: 'إعدادات الفروع والطباعة', href: '/settings' },
    ],
  },
];

import type { PharmacySession } from '@/core/pharmacy/session_service';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  session?: PharmacySession | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { activeBranchId, setActiveBranchId } = useSessionStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    home: true,
  });

  useEffect(() => {
    LookupsRepository.branches()
      .then((rows) => {
        setBranches(rows);
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('falcon_active_branch_id') : null;
        if (!stored && rows[0]) setActiveBranchId(rows[0].id);
      })
      .catch((err) => console.warn('[AppSidebar] branches load failed:', err));
  }, [setActiveBranchId]);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const handleBranchSelect = (branchId: string) => {
    setActiveBranchId(branchId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('falcon_active_branch_id', branchId);
      window.dispatchEvent(new Event('falcon_data_changed'));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchLabel = item.label.toLowerCase().includes(q);
    const matchSub = item.subItems?.some((s) => s.label.toLowerCase().includes(q));
    return matchLabel || matchSub;
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'z-40 h-full w-[260px] shrink-0 flex flex-col justify-between bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 transition-all duration-300 select-none',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:overflow-hidden',
          'fixed lg:static top-0 right-0'
        )}
      >
        {/* ========================================================================= */}
        {/* Top Header: Brand Logo & Search Input matching screenshot */}
        {/* ========================================================================= */}
        <div className="p-4 flex flex-col gap-3.5 border-b border-slate-100 dark:border-slate-800">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Medical Caduceus / Snake Icon */}
              <div className="w-10 h-10 rounded-full border-2 border-[#1d4ed8] flex items-center justify-center text-[#1d4ed8] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-xs shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-black text-[#1d4ed8] dark:text-blue-400 text-sm tracking-tight leading-tight">
                  لوجيسكا سيستمز
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 leading-none mt-0.5">
                  نظام إدارة الصيدليات المحترف
                </span>
                <span className="text-[9px] font-black text-[#1d4ed8]/70 dark:text-blue-400/70 tracking-wider">
                  PHARMA ERP SYSTEM
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input matching screenshot */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pr-3 pl-8 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] text-right"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Navigation List: Accordions matching screenshot */}
        {/* ========================================================================= */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isHome = item.id === 'home';
            const isCurrentActive = isHome ? pathname === '/' : item.subItems?.some((s) => pathname === s.href);
            const isExpanded = !!expandedItems[item.id];

            return (
              <div key={item.id} className="space-y-0.5">
                {/* Main Accordion Trigger */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    isHome && pathname === '/'
                      ? 'bg-[#eaf1fb] dark:bg-blue-950/60 text-[#1d4ed8] dark:text-blue-300 border-r-4 border-[#1d4ed8]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('w-4 h-4', isCurrentActive ? 'text-[#1d4ed8] dark:text-blue-400' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </div>

                {/* Sub Items */}
                {isExpanded && item.subItems && (
                  <div className="pr-6 pl-2 py-0.5 space-y-0.5">
                    {item.subItems.map((sub, idx) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={idx}
                          href={sub.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors',
                            isSubActive
                              ? 'text-[#1d4ed8] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 font-bold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-[#1d4ed8] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          )}
                        >
                          {isHome && <Activity className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* Bottom Branch Selector Card matching screenshot */}
        {/* ========================================================================= */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#1d4ed8] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">
                      الفرع الحالي
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {activeBranch ? activeBranch.name : 'الفرع الرئيسي'}
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1 text-right">
              <DropdownMenuLabel className="text-[11px] font-bold text-slate-400 px-2 py-1.5">
                تبديل الفرع النشط
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {branches.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => handleBranchSelect(b.id)}
                  className="flex items-center justify-between px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-md"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{b.name}</span>
                  </div>
                  {b.id === activeBranch?.id && (
                    <Check className="w-4 h-4 text-[#1d4ed8]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
};
