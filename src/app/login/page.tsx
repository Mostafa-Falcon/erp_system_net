'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { signInWithEmail } from '@/core/pharmacy/session_service';
import { useSessionStore } from '@/core/state/useSessionStore';
import { toast } from 'sonner';
import { Pill, Eye, EyeOff, Lock, Mail, Sun, Moon, LogIn, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { session, setSession, isReady } = useSessionStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  useEffect(() => {
    const saved = window.localStorage.getItem('falcon_theme');
    const dark = saved === 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(dark);
    applyTheme(dark);
  }, []);

  useEffect(() => {
    if (isReady && session) router.replace('/');
  }, [isReady, session, router]);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    applyTheme(next);
    window.localStorage.setItem('falcon_theme', next ? 'dark' : 'light');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const active = await signInWithEmail(email, password);
      setSession(active);
      toast.success(`مرحباً بك يا ${active.name}`);
      router.replace('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070b18] overflow-x-hidden transition-colors">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#0a1026] text-white items-center justify-center p-12">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-teal-400/10 blur-[90px]" />
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mb-6 border border-white/20">
            <Pill className="w-10 h-10 text-emerald-300" />
          </div>
          <h1 className="text-4xl font-black mb-3">Falcon Pharmacy</h1>
          <p className="text-emerald-100/90 font-semibold leading-relaxed">
            منظومة إدارة الصيدلية والمحاسبة المتكاملة
            <br />
            مبيعات، مخزون، صلاحية، حسابات، وتقارير في مكان واحد.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-emerald-100/80">
            <ShieldCheck className="w-4 h-4" />
            <span>نظام مشفر ومحمي بأعلى معايير الأمان</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="flex items-center justify-between mb-4">
            <span className="lg:hidden flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
              <Pill className="w-5 h-5" /> Falcon Pharmacy
            </span>
            <span className="hidden lg:inline text-xs font-bold text-muted-foreground">تسجيل الدخول للنظام</span>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9 rounded-xl">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          <Card className="w-full border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-2xl rounded-3xl">
            <CardHeader className="text-center pb-3 pt-6">
              <CardTitle className="text-2xl sm:text-3xl font-black">تسجيل الدخول</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">
                أدخل بيانات حسابك لتسجيل الدخول إلى النظام
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block font-bold text-xs sm:text-sm text-right">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    required
                    className="h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
                    icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="block font-bold text-xs sm:text-sm text-right">
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
                    icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                    trailingIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground"
                        title={showPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl mt-4 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4 pb-4">
              <p className="text-xs font-semibold text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link href="/register" className="text-emerald-600 font-bold hover:underline mr-1">
                  إنشاء حساب صيدلية جديد
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
