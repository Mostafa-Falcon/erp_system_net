'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  Search,
  Printer,
  FileText,
  FileSpreadsheet,
  Columns,
  ChevronDown,
  Info,
  Eye,
  Lock,
  Plus,
  SlidersHorizontal,
  Crown
} from 'lucide-react';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { TreasuryRepository } from '@/modules/treasury/treasury_repository';
import { db } from '@/core/db/app_database';
import { formatNumber } from '@/lib/format';
import type { CashierShift, Treasury, User as UserType } from '@/types';
import { toast } from 'sonner';
import { ShiftDetailModal } from './ShiftDetailModal';
import { AdminCloseShiftModal } from './AdminCloseShiftModal';
import { OpenShiftModal } from './OpenShiftModal';

export function ShiftsManager() {
  const router = useRouter();
  const { currentUser, activeBranchId, setActiveBranchId, setActiveShift } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const branchId = activeBranchId || currentUser?.branch_id || '';
  const [resolvedBranchId, setResolvedBranchId] = useState('');
  const [branchName, setBranchName] = useState('');

  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'manager';

  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [filterType, setFilterType] = useState<'all' | 'open' | 'closed' | 'today' | 'owner' | 'employee' | 'diff'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<CashierShift | null>(null);
  const [selectedShiftForClose, setSelectedShiftForClose] = useState<CashierShift | null>(null);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);

  const loadData = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const { v4: uuidv4 } = await import('uuid');

      let effectiveBranchId = branchId || resolvedBranchId;
      if (!effectiveBranchId && orgId) {
        const b = await db.branches.where('org_id').equals(orgId).first();
        if (b) {
          effectiveBranchId = b.id;
          setResolvedBranchId(b.id);
          setActiveBranchId(b.id);
          setBranchName(b.name);
        }
      } else if (effectiveBranchId && !branchName) {
        const b = await db.branches.get(effectiveBranchId);
        if (b) setBranchName(b.name);
      }

      let [sft, tres, usrs] = await Promise.all([
        SalesRepository.getShifts(effectiveBranchId, orgId),
        db.treasuries.where('org_id').equals(orgId).and((t) => t.is_active).toArray(),
        db.users.where('org_id').equals(orgId).toArray(),
      ]);

      if (tres.length === 0 && orgId) {
        const defaultTreasury = await TreasuryRepository.ensureDefaultTreasury({
          orgId,
          branchId: effectiveBranchId || undefined,
        });
        tres = [defaultTreasury];
      }

      setShifts(sft);
      setTreasuries(tres);
      setUsers(usrs);

      // Keep activeShift in sync
      const myOpen = sft.find((s) => s.user_id === currentUser?.id && s.status === 'open');
      setActiveShift(myOpen || null);
    } catch (err) {
      console.error('Load shifts error:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الورديات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, branchId]);

  const getUser = (id?: string | null) => users.find((user) => user.id === id);
  const getUserName = (id?: string | null) => {
    if (!id) return '—';
    const u = getUser(id);
    return u?.full_name || u?.username || '—';
  };

  const isUserOwnerOrAdmin = (id?: string | null) => {
    const u = getUser(id);
    return u?.role === 'admin' || u?.role === 'super_admin' || u?.role === 'manager';
  };

  // Date formatter identical to the screenshots: "أمس، 10:37 م" / "15 سبتمبر 2026، 11:38 ص"
  const formatShiftDateTime = (dateIso?: string | null): string => {
    if (!dateIso) return '---';
    const d = new Date(dateIso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) return `اليوم، ${timeStr}`;
    if (isYesterday) return `أمس، ${timeStr}`;

    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}، ${timeStr}`;
  };

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      // Filter by type
      if (filterType === 'open' && s.status !== 'open') return false;
      if (filterType === 'closed' && s.status !== 'closed') return false;
      if (filterType === 'today') {
        const isToday = new Date(s.opened_at).toDateString() === new Date().toDateString();
        if (!isToday) return false;
      }
      if (filterType === 'owner') {
        if (!isUserOwnerOrAdmin(s.user_id)) return false;
      }
      if (filterType === 'employee') {
        if (isUserOwnerOrAdmin(s.user_id)) return false;
      }
      if (filterType === 'diff') {
        if (!s.difference || s.difference === 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = String(s.shift_number).includes(q);
        const nameMatch = getUserName(s.user_id).toLowerCase().includes(q);
        return numMatch || nameMatch;
      }

      return true;
    });
  }, [shifts, filterType, searchQuery, users]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / pageSize));
  const paginatedShifts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShifts.slice(start, start + pageSize);
  }, [filteredShifts, currentPage, pageSize]);

  return (
    <div className="space-y-4 select-none" dir="rtl">
      
      {/* ==============================================================
          1. TOP HEADER (سجل ورديات الكاشير)
         ============================================================== */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          سجل ورديات الكاشير
        </h1>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsOpenShiftModalOpen(true)}
            size="sm"
            className="h-9 px-3.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>فتح وردية جديدة</span>
          </Button>
        </div>
      </div>

      {/* ==============================================================
          2. FILTER & SEARCH BAR (قائمة منسدلة + حقل بحث واسع زي الصورة)
         ============================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Dropdown Filter: كل الورديات */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="all">كل الورديات</option>
            <option value="open">الورديات المفتوحة</option>
            <option value="closed">الورديات المغلقة</option>
            <option value="today">ورديات اليوم</option>
            {isOwnerOrAdmin && (
              <>
                <option value="owner">ورديات صاحب المنشأة</option>
                <option value="employee">ورديات الموظفين</option>
              </>
            )}
            <option value="diff">ورديات بها عجز أو زيادة</option>
          </select>
        </div>

        {/* Large Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="بحث باسم الكاشير أو رقم الوردية..."
            className="w-full h-11 pr-4 pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* ==============================================================
          3. TABLE CONTAINER (مطابق تماماً لتصميم المنظومة بالصور)
         ============================================================== */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        
        {/* Table Toolbar Row */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Left tools in LTR / Right in RTL: Icons */}
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

          {/* Columns customization & Page size selector */}
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">
            جاري تحميل سجل الورديات...
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">
            لا توجد ورديات مسجلة مطابقة للبحث.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      #
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      الكاشير
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      تاريخ الفتح
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      رصيد الفتح
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      تاريخ الإغلاق
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      رصيد الإغلاق
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      الحالة
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-800">
                      الإجراءات
                      <span className="text-[10px] text-slate-400">↕</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-bold">
                {paginatedShifts.map((s) => {
                  const isOpen = s.status === 'open';
                  const canCloseShift = isOpen && (isOwnerOrAdmin || s.user_id === currentUser?.id);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* # رقم الوردية */}
                      <td className="py-3.5 px-3 font-mono font-black text-slate-900 dark:text-white">
                        {s.shift_number}
                      </td>

                      {/* الكاشير */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 dark:text-white">
                            {getUserName(s.user_id)}
                          </span>
                          {isUserOwnerOrAdmin(s.user_id) && (
                            <span title="صاحب المنشأة / الإدارة" className="text-amber-500">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* تاريخ الفتح */}
                      <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {formatShiftDateTime(s.opened_at)}
                      </td>

                      {/* رصيد الفتح */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatNumber(s.opening_balance)} ج.م
                      </td>

                      {/* تاريخ الإغلاق */}
                      <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {isOpen ? '---' : formatShiftDateTime(s.closed_at)}
                      </td>

                      {/* رصيد الإغلاق */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {isOpen
                          ? '---'
                          : `${formatNumber(s.actual_closing_balance !== null && s.actual_closing_balance !== undefined ? s.actual_closing_balance : s.expected_closing_balance)} ج.م`}
                      </td>

                      {/* الحالة */}
                      <td className="py-3.5 px-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          }`}
                        >
                          {isOpen ? 'مفتوحة' : 'مغلقة'}
                        </Badge>
                      </td>

                      {/* الإجراءات */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* زر عرض التفاصيل مع Tooltip مطابق للصورة 2 */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                if (s.status === 'open') {
                                  router.push(`/sales/shifts/close?id=${s.id}`);
                                } else {
                                  setSelectedShiftForDetail(s);
                                }
                              }}
                              className="w-7 h-7 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-md whitespace-nowrap z-30 pointer-events-none">
                              عرض التفاصيل
                            </span>
                          </div>

                          {/* زر إغلاق الوردية لصاحب المنشأة أو الكاشير */}
                          {canCloseShift && (
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => router.push(`/sales/shifts/close?id=${s.id}`)}
                                className="w-7 h-7 rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 inline-flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                              <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-md whitespace-nowrap z-30 pointer-events-none">
                                إغلاق وتدقيق الوردية
                              </span>
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

        {/* Table Footer: Pagination matching Screenshot 1 */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {/* Right info text */}
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              عرض {filteredShifts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} إلى{' '}
              {Math.min(currentPage * pageSize, filteredShifts.length)} من إجمالي {filteredShifts.length} وردية
            </span>
          </div>

          {/* Left navigation controls with pink active page indicator */}
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
          4. MODALS (تفاصيل الوردية، إغلاق الوردية، فتح وردية جديدة)
         ============================================================== */}
      
      {/* تفاصيل الوردية */}
      <ShiftDetailModal
        shift={selectedShiftForDetail}
        isOpen={Boolean(selectedShiftForDetail)}
        onClose={() => setSelectedShiftForDetail(null)}
        users={users}
        treasuries={treasuries}
      />

      {/* إغلاق الوردية */}
      <AdminCloseShiftModal
        shift={selectedShiftForClose}
        isOpen={Boolean(selectedShiftForClose)}
        onClose={() => setSelectedShiftForClose(null)}
        currentUser={currentUser}
        users={users}
        treasuries={treasuries}
        onShiftClosed={() => {
          setSelectedShiftForClose(null);
          loadData();
        }}
      />

      {/* فتح وردية جديدة */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        currentUser={currentUser}
        orgId={orgId}
        branchId={branchId || resolvedBranchId}
        branchName={branchName}
        treasuries={treasuries}
        onShiftOpened={(shift) => {
          setIsOpenShiftModalOpen(false);
          setActiveShift(shift);
          loadData();
        }}
      />

    </div>
  );
}
