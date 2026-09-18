'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { registerAccount } from '@/core/pharmacy/session_service';
import { useSessionStore } from '@/core/state/useSessionStore';
import { toast } from 'sonner';
import { Pill, Eye, EyeOff, Lock, Mail, Building2, UserCog, Phone, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useSessionStore();

  const [pharmacyName, setPharmacyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await registerAccount({
        pharmacyName: pharmacyName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setSession(session);
      toast.success('تم إنشاء حساب الصيدلية بنجاح.');
      router.replace('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر إنشاء الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070b18] overflow-x-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0f766e] via-[#064e3b] to-[#0a1026] text-white items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-[80px]" />
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mb-6 border border-white/20">
            <Pill className="w-10 h-10 text-emerald-300" />
          </div>
          <h1 className="text-4xl font-black mb-3">انطلق بصيدليتك</h1>
          <p className="text-emerald-100/90 font-semibold leading-relaxed">
            أنشئ حساب صيدلية جديد واحصل على فرع رئيسي، خزينة، دليل حسابات، ولوحة تحكم كاملة.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-emerald-100/80">
            <ShieldCheck className="w-4 h-4" />
            <span>بياناتك محمية ومعزولة بالكامل</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 sm:px-8">
        <div className="w-full max-w-[460px]">
          <div className="mb-4 lg:hidden">
            <span className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
              <Pill className="w-5 h-5" /> Falcon Pharmacy
            </span>
          </div>

          <Card className="w-full border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-2xl rounded-3xl">
            <CardHeader className="text-center pb-3 pt-6">
              <CardTitle className="text-2xl font-black">إنشاء حساب صيدلية</CardTitle>
              <CardDescription className="text-xs font-medium">
                سيتم تجهيز الفرع الرئيسي والخزينة تلقائياً
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName" className="block font-bold text-xs text-right">اسم الصيدلية</Label>
                  <Input
                    id="pharmacyName"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="صيدلية النور"
                    required
                    className="h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
                    icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="block font-bold text-xs text-right">اسم المالك</Label>
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="أحمد محمد"
                      required
                      className="h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
                      icon={<UserCog className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="block font-bold text-xs text-right">رقم الهاتف (اختياري)</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
                      icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="block font-bold text-xs text-right">البريد الإلكتروني</Label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="block font-bold text-xs text-right">كلمة المرور</Label>
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
                        <button type="button" onClick={() => setShowPassword(!showPassword)} title="إظهار/إخفاء">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="block font-bold text-xs text-right">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
                      icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري إنشاء الحساب...</span>
                    </>
                  ) : (
                    <span>إنشاء الحساب</span>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4 pb-4">
              <p className="text-xs font-semibold text-muted-foreground">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-emerald-600 font-bold hover:underline mr-1">
                  تسجيل الدخول
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
