'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  BarChart3,
  RotateCcw,
  FileText,
  Users,
  ShoppingCart,
  Truck,
  Receipt,
  Pill,
  ShieldCheck,
  PlusCircle,
  QrCode,
  ArrowLeftRight,
  Settings,
  History,
  TrendingUp,
  User,
  RefreshCw,
  Sparkles,
  Layers,
  ShoppingBag,
  Briefcase,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useSessionStore } from '@/core/state/useSessionStore';
import { LookupsRepository } from '@/core/pharmacy/lookups_repository';
import type { Branch } from '@/types/pharmacy';

export default function DashboardPage() {
  const { session, activeBranchId } = useSessionStore();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    LookupsRepository.branches()
      .then(setBranches)
      .catch(() => []);
  }, []);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const branchName = activeBranch ? activeBranch.name : 'الفرع الرئيسي';
  const userName = session?.name || 'عوض';

  return (
    <AppShell hideHeaderBanner>
      <div className="flex flex-col gap-6 w-full select-none max-w-[1550px] mx-auto text-right" dir="rtl">
        {/* ========================================================================= */}
        {/* 1. Header Bar: Title on RIGHT, Cloud Connection Pill on LEFT */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between w-full">
          {/* Title on the RIGHT */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            لوحة المتابعة الرئيسية
          </h1>

          {/* Cloud Status Pill on the LEFT */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>متصل (سحابي)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_#10b981]"></span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Royal Blue Welcome Banner */}
        {/* ========================================================================= */}
        <div className="w-full rounded-2xl bg-[#2550a8] text-white p-6 sm:p-7 shadow-sm flex items-center justify-between relative overflow-hidden">
          {/* Right Side: Greeting & Branch Name */}
          <div className="flex flex-col items-start gap-1.5 z-10 text-right">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                أهلاً بك {userName}
              </h2>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-blue-100/90">
              الفرع: {branchName}
            </p>
          </div>

          {/* Left Side: User Icon Circle */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white shadow-inner shrink-0 z-10">
            <User className="w-9 h-9 text-white" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. The 4 Operation Columns Grid (Right to Left: Sales, Purchases, Stock, Admin) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full">
          {/* --------------------------------------------------------------------- */}
          {/* Column 1 (Rightmost): المبيعات (Fuchsia / Magenta) */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm sm:text-base">
              <span>المبيعات</span>
              <Sparkles className="w-4 h-4 text-[#d9008f]" />
            </div>

            {/* Big Primary Action: نقطة البيع */}
            <Link
              href="/sales/pos"
              className="w-full h-28 rounded-xl bg-[#d9008f] hover:bg-[#c20080] text-white flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group"
            >
              <Store className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-150" />
              <span className="font-black text-lg text-white">نقطة البيع</span>
              <span className="text-[11px] text-white/80 font-medium">فتح العملية</span>
            </Link>

            {/* Row 1: تقرير مبيعات (Right) + مرتجع بيع (Left) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/sales/invoices"
                className="h-16 rounded-xl bg-[#d9008f] hover:bg-[#c20080] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">تقرير مبيعات</span>
              </Link>

              <Link
                href="/sales/returns"
                className="h-16 rounded-xl bg-[#d9008f] hover:bg-[#c20080] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">مرتجع بيع</span>
              </Link>
            </div>

            {/* Row 2: عروض أسعار (Right) + العملاء (Left) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/sales/invoices"
                className="h-16 rounded-xl bg-[#d9008f] hover:bg-[#c20080] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">عروض أسعار</span>
              </Link>

              <Link
                href="/contacts/customers"
                className="h-16 rounded-xl bg-[#d9008f] hover:bg-[#c20080] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">العملاء</span>
              </Link>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Column 2 (Middle-Right): المشتريات (Warm Orange) */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm sm:text-base">
              <span>المشتريات</span>
              <ShoppingBag className="w-4 h-4 text-[#d97706]" />
            </div>

            {/* Big Primary Action: إضافة مشتريات */}
            <Link
              href="/purchases/invoices"
              className="w-full h-28 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group"
            >
              <ShoppingCart className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-150" />
              <span className="font-black text-lg text-white">إضافة مشتريات</span>
              <span className="text-[11px] text-white/80 font-medium">فتح العملية</span>
            </Link>

            {/* Row 1: مرتجع شراء (Right) + الموردين (Left) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/purchases/returns"
                className="h-16 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">مرتجع شراء</span>
              </Link>

              <Link
                href="/contacts/suppliers"
                className="h-16 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">الموردين</span>
              </Link>
            </div>

            {/* Wide Full Width Action: المصروفات */}
            <Link
              href="/treasury/expenses"
              className="h-16 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer w-full"
            >
              <Receipt className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">المصروفات</span>
            </Link>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Column 3 (Middle-Left): المخزون (Teal / Green) */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm sm:text-base">
              <span>المخزون</span>
              <Layers className="w-4 h-4 text-[#0d9488]" />
            </div>

            {/* Big Primary Action: الأدوية */}
            <Link
              href="/medicines"
              className="w-full h-28 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group"
            >
              <Pill className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-150" />
              <span className="font-black text-lg text-white">الأدوية</span>
              <span className="text-[11px] text-white/80 font-medium">إدارة الكميات</span>
            </Link>

            {/* Row 1: حالة المخزون (Right) + إضافة دواء (Left) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/inventory/batches"
                className="h-16 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">حالة المخزون</span>
              </Link>

              <Link
                href="/medicines"
                className="h-16 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">إضافة دواء</span>
              </Link>
            </div>

            {/* Row 2: تحويل مخزون (Right) + طباعة باركود (Left) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/inventory/transfers"
                className="h-16 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">تحويل مخزون</span>
              </Link>

              <Link
                href="/medicines"
                className="h-16 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">طباعة باركود</span>
              </Link>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Column 4 (Leftmost): الشؤون الإدارية والمالية (Indigo / Purple) */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm sm:text-base">
              <span>الشؤون الإدارية والمالية</span>
              <Briefcase className="w-4 h-4 text-[#5046e5]" />
            </div>

            {/* Big Primary Action: الإعدادات */}
            <Link
              href="/settings"
              className="w-full h-28 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group"
            >
              <Settings className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-150" />
              <span className="font-black text-lg text-white">الإعدادات</span>
              <span className="text-[11px] text-white/80 font-medium">فتح الإعدادات</span>
            </Link>

            {/* Row 1: المستخدمين (Right) + سجل النشاط (Left) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/hr/employees"
                className="h-16 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">المستخدمين</span>
              </Link>

              <Link
                href="/sales/shifts"
                className="h-16 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <History className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">سجل النشاط</span>
              </Link>
            </div>

            {/* Wide Full Width Action: الأرباح والخسائر */}
            <Link
              href="/reports/profit-loss"
              className="h-16 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white flex flex-col items-center justify-center gap-1 text-center shadow-xs hover:shadow-sm transition-all cursor-pointer w-full"
            >
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">الأرباح والخسائر</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
