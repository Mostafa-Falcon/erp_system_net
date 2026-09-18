'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu, Sun, Moon, Bell, RefreshCw, Calculator,
  Store, Headphones, Cloud, Calendar, ArrowRight, ArrowLeft,
  X, Check, LogOut, Settings, Phone, MessageSquare, ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useSessionStore } from '@/core/state/useSessionStore';
import { LookupsRepository } from '@/core/pharmacy/lookups_repository';
import type { Branch } from '@/types/pharmacy';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
  isDark,
  onToggleTheme,
}) => {
  const router = useRouter();
  const { session, logout } = useSessionStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('0');

  // Today's date in YYYY-MM-DD format
  const todayStr = new Date().toISOString().split('T')[0];

  // User letter initial
  const userInitial = session?.name
    ? session.name.trim().charAt(0)
    : session?.email
    ? session.email.charAt(0).toUpperCase()
    : 'م';

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new Event('falcon_data_changed'));
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Simple Calculator logic
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
    } else if (val === '=') {
      try {
        // Safe arithmetic evaluation
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcInput(String(res));
      } catch {
        setCalcInput('خطأ');
      }
    } else {
      setCalcInput((prev) => (prev === '0' || prev === 'خطأ' ? val : prev + val));
    }
  };

  return (
    <>
      <header className="h-16 shrink-0 flex items-center justify-between gap-3 px-4 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 select-none">
        {/* ========================================================================= */}
        {/* Right Side (in RTL): Menu Hamburger & Collapse Arrow Buttons */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="تبديل القائمة الجانبية"
            title="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="تصغير / تكبير"
            title="طي القائمة"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* Left Side (in RTL): Tools, Notifications, Connection & User Avatar */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. Date Pill Display matching screenshot */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span dir="ltr">{todayStr}</span>
          </div>

          {/* 2. Notifications Bell with Badge matching screenshot (+99) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="مركز الإشعارات والتنبيهات"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -left-0.5 bg-rose-500 text-white text-[9px] font-black px-1 min-w-[17px] h-4 rounded-full flex items-center justify-center shadow-xs">
                  +99
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-2 text-right">
              <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white">مركز التنبيهات</span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-600 px-1.5 py-0.5 rounded font-bold">12 تنبيه عاجل</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-1 max-h-64 overflow-y-auto p-1">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-100">نواقص في المخزون</p>
                    <p className="text-[11px] text-slate-500">أصناف قاربت على النفاد تحتاج أمر توريد عاجل.</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-100">صلاحية تشغيلات قريبة</p>
                    <p className="text-[11px] text-slate-500">يوجد تشغيلات تنتهي صلاحيتها خلال الـ 90 يوماً القادمة.</p>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Technical Support Headset Button */}
          <button
            onClick={() => setIsSupportOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="الدعم الفني والمساعدة"
          >
            <Headphones className="w-5 h-5" />
          </button>

          {/* 4. POS Cashier Quick Button */}
          <button
            onClick={() => router.push('/sales/pos')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="نقطة البيع السريعة (POS - F1)"
          >
            <Store className="w-5 h-5" />
          </button>

          {/* 5. Built-in Calculator Button */}
          <button
            onClick={() => setIsCalcOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="الآلة الحاسبة السريعة"
          >
            <Calculator className="w-5 h-5" />
          </button>

          {/* 6. Cloud Connection Status Pill matching screenshot (متصل) */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="حالة الاتصال: متصل"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Cloud className="w-3.5 h-3.5 opacity-80" />
            <span>متصل</span>
          </button>

          {/* 7. Theme Toggle (Moon / Sun) matching screenshot */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* 8. User Initial Avatar Circle (ع) matching screenshot */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                title={session?.name || 'المستخدم'}
              >
                {userInitial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1 text-right" forceMount>
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {session?.name || session?.email || 'المستخدم'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 truncate">
                    {session?.role === 'admin' ? 'مدير عام الصيدلية' : session?.role || 'كاشير / مسؤول'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-xs font-semibold cursor-pointer px-2.5 py-2"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>إعدادات النظام</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer px-2.5 py-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* Quick Calculator Modal */}
      {/* ========================================================================= */}
      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[320px] p-4 text-right" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span>الآلة الحاسبة السريعة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left mb-3">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white truncate" dir="ltr">
              {calcInput}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2" dir="ltr">
            {['C', '/', '*', '-'].map((b) => (
              <button
                key={b}
                onClick={() => handleCalcBtn(b)}
                className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold hover:bg-slate-300 transition-colors"
              >
                {b}
              </button>
            ))}
            {['7', '8', '9', '+'].map((b) => (
              <button
                key={b}
                onClick={() => handleCalcBtn(b)}
                className={cn(
                  'h-10 rounded-lg font-bold transition-colors',
                  b === '+'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                    : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                )}
              >
                {b}
              </button>
            ))}
            {['4', '5', '6', '='].map((b) => (
              <button
                key={b}
                onClick={() => handleCalcBtn(b)}
                className={cn(
                  'h-10 rounded-lg font-bold transition-colors',
                  b === '='
                    ? 'bg-primary text-primary-foreground row-span-2 h-[88px]'
                    : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                )}
              >
                {b}
              </button>
            ))}
            {['1', '2', '3'].map((b) => (
              <button
                key={b}
                onClick={() => handleCalcBtn(b)}
                className="h-10 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {b}
              </button>
            ))}
            {['0', '.'].map((b) => (
              <button
                key={b}
                onClick={() => handleCalcBtn(b)}
                className={cn(
                  'h-10 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold',
                  b === '0' && 'col-span-2'
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Technical Support Modal */}
      {/* ========================================================================= */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-md p-5 text-right" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Headphones className="w-5 h-5 text-emerald-600" />
              <span>مركز الدعم الفني والمساعدة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">الخط الساخن المباشر</p>
                  <p className="text-[11px] text-slate-500 font-mono" dir="ltr">+20 100 000 0000</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                اتصال
              </Button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">دعم عبر واتساب</p>
                  <p className="text-[11px] text-slate-500">محادثة فورية مع فريق لوجيسكا</p>
                </div>
              </div>
              <Button size="sm" className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                فتح واتساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
