'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthBrandingPanel } from '@/components/auth/AuthBrandingPanel';
import { AuthRepository } from '@/modules/auth/auth_repository';
import { useSessionStore } from '@/core/state/useSessionStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useSessionStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. PIN or Quick code login (especially for cashiers)
      if (/^\d{4,6}$/.test(password) && !email.includes('@')) {
        const userByPin = await AuthRepository.loginWithPin(password);
        if (userByPin) {
          toast.success(`مرحباً بك مجدداً يا ${userByPin.full_name}`);
          setCurrentUser(userByPin);
          router.push('/');
          return;
        }
      }

      // 2. Email / Username credential authentication
      const result = await AuthRepository.loginWithEmail(email, password);
      if (result.user) {
        toast.success(`تم تسجيل الدخول بنجاح! مرحباً بك يا ${result.user.full_name}`);
        setCurrentUser(result.user);
        router.push('/');
      } else {
        toast.error(result.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تسجيل الدخول.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f4f6f8] select-none overflow-x-hidden">
      {/* 1. Mobile & Tablet Top Branding Banner (< lg) */}
      <div className="lg:hidden w-full bg-gradient-to-b from-[#0c2e1c] via-[#092316] to-[#05180e] text-white px-6 py-7 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#16a34a] opacity-15 blur-[60px] pointer-events-none" />
        
        {/* Compact Emblem */}
        <div className="w-16 h-16 rounded-full bg-[#123924] border-3 border-[#1e4e32] shadow-xl flex items-center justify-center p-1.5 mb-2.5 z-10">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#6bc639] via-[#3aa639] to-[#168138] flex items-center justify-center shadow-inner">
            <div className="relative w-7 h-8 bg-white rounded-xs shadow flex items-center justify-center pl-1">
              <div className="absolute left-0.5 top-1 flex flex-col gap-1">
                <span className="w-1 h-1 rounded-full bg-[#1b5e20]" />
                <span className="w-1 h-1 rounded-full bg-[#1b5e20]" />
                <span className="w-1 h-1 rounded-full bg-[#1b5e20]" />
              </div>
              <span className="text-[#1b5e20] font-black text-sm leading-none mr-0.5">$</span>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-black text-white tracking-tight z-10">
          منظومة الإدارة الشاملة
        </h1>
        <p className="text-xs font-semibold text-emerald-200/80 z-10 mt-0.5">
          نظام الإدارة والمحاسبة المتكامل
        </p>
      </div>

      {/* 2. Desktop Right Branding Panel (>= lg) */}
      <div className="hidden lg:block lg:w-[50%] xl:w-[52%] min-h-screen">
        <AuthBrandingPanel />
      </div>

      {/* 3. Form Side (Left on Desktop, Below Banner on Mobile) */}
      <div className="w-full lg:w-[50%] xl:w-[48%] min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <Card className="w-full max-w-[430px] border-slate-200/80 dark:border-slate-800 shadow-xl dark:bg-[#131b2e] my-auto">
          {/* shadcn Tabs Switcher */}
          <div className="p-6 pb-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="cursor-default">
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  onClick={() => router.push('/register')}
                  className="cursor-pointer"
                >
                  إنشاء حساب منشأة
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CardHeader className="text-center pb-3 pt-5">
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              سجل دخولك الآن للوصول إلى لوحة التحكم الخاصة بمنشأتك.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email / Username Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="block text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm text-right">
                  البريد الإلكتروني أو اسم المستخدم
                </Label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  required
                  className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-[#558b2f] text-sm"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 hover:text-[#558b2f] cursor-pointer">
                    نسيت كلمة المرور؟
                  </span>
                  <Label htmlFor="password" className="block text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm text-right">
                    كلمة المرور
                  </Label>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-[#558b2f] text-sm tracking-wider"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                  trailingIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  }
                />
              </div>

              {/* shadcn Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 sm:h-12 bg-[#558b2f] hover:bg-[#436d25] text-white font-bold text-sm sm:text-base rounded-xl shadow-sm transition-all mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-[#558b2f] font-bold hover:underline mr-1">
                إنشاء حساب جديد
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
