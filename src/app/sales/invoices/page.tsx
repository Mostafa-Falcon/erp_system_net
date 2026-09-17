'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  History,
  Printer,
  FileText,
  FileSpreadsheet,
  SlidersHorizontal,
  Columns,
  Search,
  ScanBarcode,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  User,
  Calendar,
  DollarSign,
  Receipt,
  Info,
  ChevronRight,
  ArrowRight,
  X,
  RotateCcw
} from 'lucide-react';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { db } from '@/core/db/app_database';
import { formatNumber } from '@/lib/format';
import type { Contact, Product, SalesInvoice, Treasury, Unit, Warehouse, User as UserType } from '@/types';
import { toast } from 'sonner';
import { InvoiceDetailModal } from '@/components/sales/invoices/InvoiceDetailModal';
import { EditInvoiceModal } from '@/components/sales/invoices/EditInvoiceModal';
import { DeleteInvoiceDialog } from '@/components/sales/invoices/DeleteInvoiceDialog';

function InvoicesContent() {
  const router = useRouter();
  const { currentUser, activeBranchId } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const branchId = activeBranchId || currentUser?.branch_id || '';

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [datePeriod, setDatePeriod] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isArchiveMode, setIsArchiveMode] = useState<boolean>(false);

  // Active Menu Dropdown for row actions
  const [openMenuInvoiceId, setOpenMenuInvoiceId] = useState<string | null>(null);

  // Modal States
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<SalesInvoice | null>(null);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<SalesInvoice | null>(null);
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<SalesInvoice | null>(null);

  // Click outside to close row menu
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuInvoiceId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const loadData = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const [invList, prods, unts, tres, whs, custs, usrs] = await Promise.all([
        isArchiveMode
          ? SalesRepository.getDeletedSalesInvoices(orgId, branchId || undefined)
          : SalesRepository.getSalesInvoices(orgId, { branchId: branchId || undefined, includeDeleted: false }),
        db.products.where('org_id').equals(orgId).toArray(),
        db.units.where('org_id').equals(orgId).toArray(),
        db.treasuries.where('org_id').equals(orgId).toArray(),
        db.warehouses.where('org_id').equals(orgId).toArray(),
        db.contacts.where('org_id').equals(orgId).toArray(),
        db.users.where('org_id').equals(orgId).toArray(),
      ]);

      setInvoices(invList);
      setProducts(prods);
      setUnits(unts);
      setTreasuries(tres);
      setWarehouses(whs);
      setCustomers(custs);
      setUsers(usrs);
    } catch (err) {
      console.error('Load sales invoices error:', err);
      toast.error('حدث خطأ أثناء تحميل فواتير المبيعات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, branchId, isArchiveMode]);

  const getUserName = (id?: string | null) => {
    if (!id) return '—';
    const u = users.find((x) => x.id === id);
    return u?.full_name || u?.username || '—';
  };

  const getCustomerName = (id?: string | null) => {
    if (!id) return 'عميل نقدي';
    const c = customers.find((x) => x.id === id);
    return c?.name || 'عميل نقدي';
  };

  // Date formatted: "2026-09-17 05:35 ص"
  const formatInvoiceDate = (dateIso?: string | null): string => {
    if (!dateIso) return '—';
    const d = new Date(dateIso);
    const datePart = d.toISOString().slice(0, 10);
    const timePart = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} ${timePart}`;
  };

  // Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Date filter
      if (datePeriod !== 'all') {
        const invDate = new Date(inv.created_at || inv.invoice_date);
        const today = new Date();
        if (datePeriod === 'today') {
          if (invDate.toDateString() !== today.toDateString()) return false;
        } else if (datePeriod === 'yesterday') {
          const yest = new Date();
          yest.setDate(yest.getDate() - 1);
          if (invDate.toDateString() !== yest.toDateString()) return false;
        } else if (datePeriod === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (invDate < weekAgo) return false;
        } else if (datePeriod === 'month') {
          if (invDate.getMonth() !== today.getMonth() || invDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        }
      }

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const numMatch = inv.invoice_number.toLowerCase().includes(q);
        const custMatch = getCustomerName(inv.customer_id).toLowerCase().includes(q);
        const userMatch = getUserName(inv.created_by).toLowerCase().includes(q);
        return numMatch || custMatch || userMatch;
      }

      return true;
    });
  }, [invoices, datePeriod, search, customers, users]);

  // Financial summary
  const totalSales = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [filteredInvoices]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  return (
    <AppShell>
      <div className="space-y-4 select-none" dir="rtl">
        
        {/* ==============================================================
            1. TOP ACTION BAR (العنوان، زر فاتورة جديدة، زر أرشيف المحذوفات)
           ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          {/* Right side: Page Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isArchiveMode ? 'أرشيف فواتير المبيعات المحذوفة' : 'فواتير البيع'}
            </h1>
          </div>

          {/* Left side: Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/sales/pos">
              <Button
                type="button"
                className="h-9 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>فاتورة جديدة</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant={isArchiveMode ? 'default' : 'outline'}
              onClick={() => {
                setIsArchiveMode(!isArchiveMode);
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                isArchiveMode
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5 text-pink-600" />
              <span>{isArchiveMode ? 'العودة للفواتير النشطة' : 'أرشيف المحذوفات'}</span>
            </Button>
          </div>
        </div>

        {/* ==============================================================
            2. SUMMARY HEADER BLOCK (كل المبيعات + كروت إجمالي المبيعات وإجمالي الفواتير)
           ============================================================== */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Right: Section Title & Subtitle */}
          <div className="space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isArchiveMode ? 'المبيعات المحذوفة والملغاة' : 'كل المبيعات'}
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              {isArchiveMode
                ? 'استعراض سجل الفواتير التي تم حذفها وإلغاؤها واسترجاع كمياتها.'
                : 'استعراض وإدارة جميع فواتير المبيعات الصادرة من هذا الفرع.'}
            </p>
          </div>

          {/* Left: 2 KPI Cards */}
          <div className="flex flex-wrap items-center gap-3">
            {/* إجمالي المبيعات */}
            <div className="min-w-[170px] bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  إجمالي المبيعات
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                  {formatNumber(totalSales)} <span className="text-xs font-bold">ج.م</span>
                </span>
              </div>
            </div>

            {/* إجمالي الفواتير */}
            <div className="min-w-[170px] bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  إجمالي الفواتير
                </span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono block">
                  {filteredInvoices.length} <span className="text-xs font-bold">فاتورة</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==============================================================
            3. FILTER BAR (الفترة الزمنية + مسح الكل)
           ============================================================== */}
        <div className="flex items-center gap-2 justify-start">
          {/* زر مسح الكل */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setSearch('');
              setDatePeriod('all');
              setCurrentPage(1);
            }}
            className="h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-2xs cursor-pointer"
          >
            مسح الكل
          </Button>

          {/* قائمة الفترة الزمنية */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">الفترة الزمنية:</span>
            <select
              value={datePeriod}
              onChange={(e) => {
                setDatePeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">الكل 📅</option>
              <option value="today">اليوم</option>
              <option value="yesterday">أمس</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>
        </div>

        {/* ==============================================================
            4. TABLE CONTAINER (مطابق لتصميم الصورة بالكامل)
           ============================================================== */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
          
          {/* Table Toolbar Row */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            {/* Left Icons: Print, PDF, Excel, Density (NO manual refresh!) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                title="طباعة"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => toast.info('جاري تصدير PDF')}
                title="تصدير PDF"
                className="w-8 h-8 rounded-lg border border-pink-200 dark:border-pink-900/50 text-pink-600 bg-pink-50/50 dark:bg-pink-950/40 hover:bg-pink-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => toast.info('جاري تصدير Excel')}
                title="تصدير Excel"
                className="w-8 h-8 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>

              <button
                type="button"
                title="خيارات العرض"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Middle & Right: Columns customization, Page size, Fast Search */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => toast.info('تخصيص الأعمدة متاح')}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>تخصيص الأعمدة</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>عرض</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>إدخالات</span>
              </div>

              {/* Fast search input with QR barcode icon and count badge */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="بحث سريع في الجدول..."
                  className="h-8 w-52 sm:w-60 pr-8 pl-14 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-slate-300"
                />
                <ScanBarcode className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                <span className="absolute left-2 bg-pink-50 dark:bg-pink-950/40 text-pink-600 border border-pink-200 dark:border-pink-900/60 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                  {filteredInvoices.length}
                </span>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {isLoading ? (
            <div className="py-20 text-center text-xs font-bold text-slate-400">
              جاري تحميل فواتير المبيعات...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center text-xs font-bold text-slate-400">
              {isArchiveMode ? 'لا توجد فواتير محذوفة في الأرشيف.' : 'لا توجد فواتير مبيعات مسجلة مطابقة للبحث.'}
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500">
                  <tr>
                    <th className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                        رقم الفاتورة
                        <span className="text-[10px] text-slate-400">↕</span>
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                        العميل
                        <span className="text-[10px] text-slate-400">↕</span>
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                        التاريخ
                        <span className="text-[10px] text-slate-400">↕</span>
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                        الإجمالي
                        <span className="text-[10px] text-slate-400">↕</span>
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                        بواسطة
                        <span className="text-[10px] text-slate-400">↕</span>
                      </span>
                    </th>
                    <th className="py-3 px-3 text-center w-20">
                      <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                        الخيارات
                        <span className="text-[10px] text-slate-400">↕</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-bold">
                  {paginatedInvoices.map((inv) => {
                    const isRowMenuOpen = openMenuInvoiceId === inv.id;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* رقم الفاتورة */}
                        <td className="py-3.5 px-4 font-mono font-black text-pink-600 dark:text-pink-400">
                          {inv.invoice_number}
                        </td>

                        {/* العميل */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">
                              {getCustomerName(inv.customer_id)}
                            </span>
                          </div>
                        </td>

                        {/* التاريخ */}
                        <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {formatInvoiceDate(inv.created_at || inv.invoice_date)}
                        </td>

                        {/* الإجمالي */}
                        <td className="py-3.5 px-3 font-mono font-black text-slate-900 dark:text-white">
                          {formatNumber(inv.total)} ج.م
                        </td>

                        {/* بواسطة */}
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                          {getUserName(inv.created_by)}
                        </td>

                        {/* الخيارات ⋮ مع القائمة المنسدلة المعتمدة في الصورة 2 */}
                        <td className="py-3.5 px-3 text-center relative">
                          <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenMenuInvoiceId(isRowMenuOpen ? null : inv.id)}
                              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Popup (مطابق للصورة 2) */}
                            {isRowMenuOpen && (
                              <div className="absolute left-8 top-2 z-40 w-36 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 text-right text-xs">
                                {/* عرض */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuInvoiceId(null);
                                    setSelectedInvoiceForDetail(inv);
                                  }}
                                  className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between font-bold cursor-pointer transition-colors"
                                >
                                  <span>عرض</span>
                                  <Eye className="w-4 h-4 text-pink-600" />
                                </button>

                                {/* تعديل */}
                                {!inv.is_deleted && inv.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuInvoiceId(null);
                                      setSelectedInvoiceForEdit(inv);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between font-bold cursor-pointer transition-colors"
                                  >
                                    <span>تعديل</span>
                                    <Edit3 className="w-4 h-4 text-blue-600" />
                                  </button>
                                )}

                                {/* حذف */}
                                {!inv.is_deleted && inv.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuInvoiceId(null);
                                      setSelectedInvoiceForDelete(inv);
                                    }}
                                    className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-between font-bold cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/80"
                                  >
                                    <span>حذف</span>
                                    <Trash2 className="w-4 h-4 text-rose-600" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer Pagination */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {/* Right info */}
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>
                عرض {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} إلى{' '}
                {Math.min(currentPage * pageSize, filteredInvoices.length)} من إجمالي {filteredInvoices.length} فاتورة مبيعات
              </span>
            </div>

            {/* Left controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer font-mono"
              >
                |&lt;
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer font-mono"
              >
                &lt;
              </button>
              <span className="px-3 py-1 rounded-lg bg-pink-50 border border-pink-200 text-pink-600 font-bold font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer font-mono"
              >
                &gt;
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer font-mono"
              >
                &gt;|
              </button>
            </div>
          </div>

        </div>

        {/* ==============================================================
            5. MODALS (عرض التفاصيل، تعديل الفاتورة، حذف الفاتورة)
           ============================================================== */}

        {/* 1. عرض تفاصيل الفاتورة */}
        <InvoiceDetailModal
          invoice={selectedInvoiceForDetail}
          isOpen={Boolean(selectedInvoiceForDetail)}
          onClose={() => setSelectedInvoiceForDetail(null)}
          products={products}
          units={units}
          customers={customers}
          treasuries={treasuries}
          users={users}
          warehouses={warehouses}
        />

        {/* 2. تعديل الفاتورة */}
        <EditInvoiceModal
          invoice={selectedInvoiceForEdit}
          isOpen={Boolean(selectedInvoiceForEdit)}
          onClose={() => setSelectedInvoiceForEdit(null)}
          currentUser={currentUser}
          products={products}
          units={units}
          customers={customers}
          onUpdated={() => loadData()}
        />

        {/* 3. حذف الفاتورة */}
        <DeleteInvoiceDialog
          invoice={selectedInvoiceForDelete}
          isOpen={Boolean(selectedInvoiceForDelete)}
          onClose={() => setSelectedInvoiceForDelete(null)}
          currentUser={currentUser}
          onDeleted={() => loadData()}
        />

      </div>
    </AppShell>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div />}>
      <InvoicesContent />
    </Suspense>
  );
}