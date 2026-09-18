'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useSessionStore } from '@/core/state/useSessionStore';

interface AppShellProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  hideHeaderBanner?: boolean;
}

/**
 * Falcon Pharmacy System application shell.
 * Unifies sidebar navigation, the top header and the content container for
 * every authenticated page.
 */
export const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  hideHeaderBanner = false,
}) => {
  const router = useRouter();
  const { session, hydrate, isReady } = useSessionStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('falcon_theme');
    const dark = saved === 'dark';
    setIsDark(dark);
    applyTheme(dark);
    const isMobile = window.innerWidth < 1024;
    setSidebarOpen(!isMobile);
  }, []);

  useEffect(() => {
    if (mounted && isReady && !session) {
      router.replace('/login');
    }
  }, [mounted, isReady, session, router]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    window.localStorage.setItem('falcon_theme', next ? 'dark' : 'light');
  };

  // Pre-mount loading state matching SSR exactly
  if (!mounted || !session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8] dark:bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {!mounted ? 'جاري التحميل...' : 'جاري التحقق من بيانات الدخول...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f6f9] dark:bg-[#0b0f19] text-foreground overflow-hidden transition-colors duration-200" dir="rtl">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} session={session} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          title={title}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          {!hideHeaderBanner && (title || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-xl border border-border/80 shadow-xs">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">{title}</h2>
                {subtitle && (
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
