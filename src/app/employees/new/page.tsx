'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  User,
  Phone,
  Briefcase,
  Store,
  Hash,
  Wallet,
  Clock,
  PlusCircle,
  MinusCircle,
  Calculator,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Save
} from 'lucide-react';
import { useSessionStore } from '@/core/state/useSessionStore';
import { EmployeeRepository, type CreateEmployeeDTO } from '@/modules/employees/employee_repository';
import type { Branch, UserRole } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

export default function AddEmployeePage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('pharmacist');
  const [branchId, setBranchId] = useState('');
  const [pinCode, setPinCode] = useState('1234');

  const [basicSalary, setBasicSalary] = useState('');
  const [salaryCycle, setSalaryCycle] = useState('monthly');
  const [deductions, setDeductions] = useState('');
  const [allowances, setAllowances] = useState('');

  const [allowLogin, setAllowLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const [permissions, setPermissions] = useState<string[]>([
    'dashboard_view',
    'inventory_view',
    'sales_view',
    'sales_pos'
  ]);

  useEffect(() => {
    if (!orgId) return;
    const loadBranches = async () => {
      const { db } = await import('@/core/db/app_database');
      const list = await db.branches.where('org_id').equals(orgId).toArray();
      setBranches(list);
      if (list.length > 0) setBranchId(list.find(b => b.is_main)?.id || list[0].id);
    };
    loadBranches();
  }, [orgId]);

  const togglePermission = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const applyTemplate = (template: string) => {
    switch (template) {
      case 'pharmacist':
        setRole('pharmacist');
        setPermissions(['dashboard_view', 'inventory_view', 'inventory_add', 'inventory_edit', 'sales_view', 'sales_pos', 'purchases_view', 'customers_view']);
        break;
      case 'cashier':
        setRole('cashier');
        setPermissions(['sales_view', 'sales_pos']);
        break;
      case 'warehouse':
        setRole('warehouse_keeper');
        setPermissions(['inventory_view', 'inventory_add', 'inventory_edit', 'inventory_transfer', 'inventory_adjust']);
        break;
      case 'accountant':
        setRole('accountant');
        setPermissions(['dashboard_view', 'finance_view', 'finance_add', 'reports_view', 'purchases_view', 'sales_view', 'customers_view']);
        break;
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !role || !branchId) {
      toast.error('يرجى إكمال البيانات الأساسية للموظف');
      return;
    }

    if (allowLogin && (!password || !email)) {
      toast.error('يرجى تعيين البريد الإلكتروني وكلمة المرور للسماح بتسجيل الدخول');
      return;
    }

    setIsSaving(true);
    try {
      const username = email ? email.split('@')[0] : `user_${Date.now()}`;

      const dto: CreateEmployeeDTO = {
        org_id: orgId,
        branch_id: branchId,
        full_name: fullName.trim(),
        username: username,
        email: allowLogin ? email : undefined,
        phone: phone,
        role: role,
        pin_code: pinCode,
        password: allowLogin ? password : undefined,
        basic_salary: Number(basicSalary) || 0,
        salary_cycle: salaryCycle as any,
        deductions: Number(deductions) || 0,
        allowances: Number(allowances) || 0,
        permissions: permissions
      };

      await EmployeeRepository.addEmployee(dto);
      toast.success('تمت إضافة الموظف بنجاح');
      router.push('/employees/directory');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const netSalary = (Number(basicSalary) || 0) + (Number(allowances) || 0) - (Number(deductions) || 0);

  return (
    <AppShell
      title="إضافة موظف جديد للنظام"
      subtitle="تسجيل موظف جديد وضبط الرواتب وحساب تسجيل الدخول وتحديد الصلاحيات بدقة"
    >
      <div className="space-y-6 text-right pb-20" dir="rtl">

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="h-10 px-3 text-slate-500 hover:text-slate-800 rounded-xl gap-2 font-bold text-xs">
            <ArrowRight className="w-4 h-4" /> العودة
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">

          {/* Section 1: Personal Info */}
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs relative">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">البيانات الشخصية والوظيفية</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">المعلومات الأساسية للهوية والمهام والفرع التابع له الموظف.</p>
                 </div>
              </div>
            </div>

            <div className="space-y-5">
               <div className="space-y-1.5">
                  <Label className="text-xs font-black text-slate-700 dark:text-slate-300">الاسم الرباعي للموظف <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="مثال: د. أحمد محمد محمود"
                      className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-bold rounded-xl focus:bg-white transition-colors"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">القسم / التخصص</Label>
                    <div className="relative">
                      <Input
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="مثال: الصيدلية، الحسابات، الدليفري..."
                        className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-bold rounded-xl focus:bg-white"
                      />
                      <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">رقم الهاتف / الواتساب <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-bold rounded-xl focus:bg-white font-mono"
                      />
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">المسمى الوظيفي ودور الحساب <span className="text-red-500">*</span></Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-sm font-black focus:bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pharmacist"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> دكتور صيدلي (Pharmacist)</div></SelectItem>
                        <SelectItem value="manager"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> مدير فرع (Manager)</div></SelectItem>
                        <SelectItem value="cashier"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> كاشير (Cashier)</div></SelectItem>
                        <SelectItem value="warehouse_keeper"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> أمين مخزن (Warehouse)</div></SelectItem>
                        <SelectItem value="accountant"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> محاسب (Accountant)</div></SelectItem>
                        <SelectItem value="delivery"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> عامل توصيل (Delivery)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">الفرع المخصص للعمل <span className="text-red-500">*</span></Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-sm font-black focus:bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            <div className="flex items-center gap-2"><Store className="w-4 h-4 text-slate-400"/> {b.name}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="space-y-1.5 pt-2">
                 <Label className="text-xs font-black text-slate-700 dark:text-slate-300">رمز PIN السريع (للكاشير ونقاط البيع)</Label>
                 <div className="relative max-w-sm">
                    <Input
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      maxLength={4}
                      placeholder="4 أرقام (مثال: 1234)"
                      className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-bold rounded-xl focus:bg-white font-mono tracking-widest"
                    />
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                 </div>
               </div>
            </div>
          </div>

          {/* Section 2: Payroll */}
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs relative">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">نظام الرواتب والأجور والبدلات</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">تحديد القيمة المالية وطريقة احتساب الأجر والاستقطاعات الشهرية.</p>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-700 dark:text-slate-300">دورة احتساب الراتب</Label>
                <Select value={salaryCycle} onValueChange={setSalaryCycle}>
                  <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-sm font-black focus:bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/> راتب شهري منتظم</div></SelectItem>
                    <SelectItem value="weekly"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/> أسبوعي</div></SelectItem>
                    <SelectItem value="daily"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/> يومية (اليوميات)</div></SelectItem>
                    <SelectItem value="hourly"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/> بالساعة</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-700 dark:text-slate-300">الراتب الأساسي الشهري (ج.م)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={basicSalary}
                    onChange={e => setBasicSalary(e.target.value)}
                    placeholder="0.00"
                    className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-black rounded-xl focus:bg-white font-mono text-left"
                    dir="ltr"
                  />
                  <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-700 dark:text-slate-300">البدلات والمكافآت الثابتة (ج.م)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={allowances}
                    onChange={e => setAllowances(e.target.value)}
                    placeholder="0.00"
                    className="h-12 bg-slate-50/50 border-emerald-100 pr-10 text-sm font-black rounded-xl focus:bg-white font-mono text-left text-emerald-600"
                    dir="ltr"
                  />
                  <PlusCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-700 dark:text-slate-300">الاستقطاعات والتأمينات (ج.م)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={deductions}
                    onChange={e => setDeductions(e.target.value)}
                    placeholder="0.00"
                    className="h-12 bg-slate-50/50 border-red-100 pr-10 text-sm font-black rounded-xl focus:bg-white font-mono text-left text-red-500"
                    dir="ltr"
                  />
                  <MinusCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-red-400" />
                </div>
              </div>
            </div>

            <div className="mt-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Calculator className="w-5 h-5 text-emerald-600" />
                 <div>
                   <h4 className="text-sm font-black text-emerald-900">صافي الراتب التقديري المستحق للموظف:</h4>
                   <p className="text-[11px] font-bold text-emerald-600/80 mt-0.5">{formatNumber(Number(basicSalary)||0)} ج.م (أساسي) + بدلات: {formatNumber(Number(allowances)||0)} - خصومات: {formatNumber(Number(deductions)||0)}</p>
                 </div>
               </div>
               <div className="text-xl font-black text-emerald-700 font-mono" dir="ltr">{formatNumber(netSalary)} <span className="text-sm">ج.م</span></div>
            </div>
          </div>

          {/* Section 3: Login Settings */}
          <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs relative">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">إعدادات الحساب وتسجيل الدخول</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">تفعيل وصول الموظف للبرنامج، وتعيين البريد وكلمة المرور للدخول.</p>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-blue-100 bg-blue-50/30">
                 <div>
                    <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">السماح للموظف بتسجيل الدخول للبرنامج <CheckCircle2 className="w-4 h-4 text-blue-600" /></h4>
                    <p className="text-[11px] font-bold text-blue-600/80 mt-1">الموظف يمتلك بريداً وكلمة مرور ويستطيع الدخول للنظام واستخدامه وفق الصلاحيات الممنوحة له.</p>
                 </div>
                 <Switch checked={allowLogin} onCheckedChange={setAllowLogin} className="data-[state=checked]:bg-blue-600" />
              </div>

              {allowLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">البريد الإلكتروني لتسجيل الدخول <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="user@pharmacy.com"
                        className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-bold rounded-xl focus:bg-white font-mono text-left"
                        dir="ltr"
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> حساب الموظف يعمل في وضع الأونلاين (السحابي) وكذلك الأوفلاين في حال انقطاع الإنترنت بنجاح.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">كلمة المرور للدخول <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="********"
                        className="h-12 bg-slate-50/50 border-slate-200 pr-10 text-sm font-black rounded-xl focus:bg-white font-mono text-left tracking-widest"
                        dir="ltr"
                      />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Permissions */}
          {allowLogin && (
            <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs relative animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">مصفوفة صلاحيات الوصول للأقسام</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">تحديد الأقسام والشاشات المسموح للموظف بفتحها والعمل عليها.</p>
                   </div>
                </div>
                <Button variant="ghost" onClick={() => setPermissions([])} className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> مسح الكل
                </Button>
              </div>

              {/* Quick Templates */}
              <div className="mb-6">
                <p className="text-[10px] font-black text-amber-600 mb-2 flex items-center gap-1"><Zap className="w-3 h-3"/> قوالب الصلاحيات السريعة (اختر قالباً لضبط الصلاحيات بنقرة واحدة):</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => applyTemplate('pharmacist')} className="h-8 rounded-full border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 text-[11px] font-black gap-1.5"><Zap className="w-3 h-3"/> صيدلي كامل</Button>
                  <Button variant="outline" onClick={() => applyTemplate('cashier')} className="h-8 rounded-full border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100 text-[11px] font-black gap-1.5"><Zap className="w-3 h-3"/> كاشير ومبيعات</Button>
                  <Button variant="outline" onClick={() => applyTemplate('warehouse')} className="h-8 rounded-full border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 text-[11px] font-black gap-1.5"><Zap className="w-3 h-3"/> أمين مخزن وجرد</Button>
                  <Button variant="outline" onClick={() => applyTemplate('accountant')} className="h-8 rounded-full border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 text-[11px] font-black gap-1.5"><Zap className="w-3 h-3"/> محاسب مالي</Button>
                </div>
              </div>

              <div className="space-y-4">

                 <PermissionSection
                   title="لوحة المتابعة"
                   icon={<Activity className="w-4 h-4 text-blue-600" />}
                   color="blue"
                   items={[
                     { id: 'dashboard_view', label: 'عرض لوحة المتابعة', desc: 'الاطلاع على الإحصائيات والأرباح والمؤشرات' }
                   ]}
                   selected={permissions}
                   onToggle={togglePermission}
                 />

                 <PermissionSection
                   title="المخزون والأصناف"
                   icon={<Archive className="w-4 h-4 text-emerald-600" />}
                   color="emerald"
                   items={[
                     { id: 'inventory_view', label: 'عرض الأصناف والمجموعات', desc: 'تصفح دليل الأدوية والكميات والأسعار' },
                     { id: 'inventory_add', label: 'إضافة أصناف جديدة', desc: 'تسجيل دواء أو صنف جديد في النظام' },
                     { id: 'inventory_edit', label: 'تعديل بيانات الأصناف', desc: 'تعديل الأسعار والباركود والحدود' },
                     { id: 'inventory_transfer', label: 'التحويل المخزني', desc: 'نقل الأصناف والكميات بين الفروع والمخازن' },
                     { id: 'inventory_adjust', label: 'الجرد وتسوية المخزون', desc: 'تسجيل الجرد الفعلي ومطابقة العجز والزيادة' },
                   ]}
                   selected={permissions}
                   onToggle={togglePermission}
                 />

                 <PermissionSection
                   title="المبيعات ونقاط البيع"
                   icon={<ShoppingBag className="w-4 h-4 text-teal-600" />}
                   color="teal"
                   items={[
                     { id: 'sales_pos', label: 'استخدام نقطة البيع (POS)', desc: 'صرف الروشتات وفواتير البيع المباشر' },
                     { id: 'sales_view', label: 'عرض فواتير المبيعات', desc: 'تصفح سجل الفواتير والمبيعات السابقة' },
                     { id: 'sales_return', label: 'عرض مرتجعات المبيعات', desc: 'معالجة وتنفيذ إرجاع فواتير المبيعات' },
                   ]}
                   selected={permissions}
                   onToggle={togglePermission}
                 />

                 <PermissionSection
                   title="المشتريات والتوريدات"
                   icon={<ShoppingBasket className="w-4 h-4 text-amber-600" />}
                   color="amber"
                   items={[
                     { id: 'purchases_view', label: 'عرض فواتير المشتريات', desc: 'الاطلاع على فواتير الشراء والتوريدات' },
                     { id: 'purchases_add', label: 'إضافة فواتير مشتريات', desc: 'إدخال فواتير شراء وأصناف جديدة' },
                     { id: 'purchases_return', label: 'عرض مرتجعات المشتريات', desc: 'إرجاع بضاعة تالفة أو راكدة للموردين' },
                   ]}
                   selected={permissions}
                   onToggle={togglePermission}
                 />

                 <PermissionSection
                   title="المالية والحسابات"
                   icon={<Wallet className="w-4 h-4 text-emerald-600" />}
                   color="emerald"
                   items={[
                     { id: 'finance_view', label: 'عرض الخزينة والنقدية', desc: 'أرصدة الخزائن والأدراج والتحويلات' },
                     { id: 'finance_expenses_view', label: 'عرض المصروفات', desc: 'سجل المصروفات والنثريات والمدفوعات' },
                     { id: 'finance_expenses_add', label: 'إضافة مصروفات', desc: 'تسجيل سند صرف أو مصروفات جديدة' },
                     { id: 'finance_journal', label: 'دفتر الأستاذ والقيود', desc: 'دليل الحسابات والقيود المحاسبية' },
                   ]}
                   selected={permissions}
                   onToggle={togglePermission}
                 />

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#131b2e]/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 z-50 flex items-center justify-center">
         <div className="max-w-4xl w-full flex items-center justify-between gap-4 mr-0 md:mr-[280px] transition-all">
            <Button variant="outline" onClick={() => router.back()} className="h-12 px-8 rounded-2xl font-black text-sm border-blue-200 text-blue-600 bg-white">
              إلغاء والعودة
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 gap-2">
              <Save className="w-5 h-5" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ وتثبيت بيانات الموظف والصلاحيات'}
            </Button>
         </div>
      </div>
    </AppShell>
  );
}

function PermissionSection({ title, icon, color, items, selected, onToggle }: { title: string, icon: React.ReactNode, color: string, items: any[], selected: string[], onToggle: (id: string) => void }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50/50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
    teal: 'bg-teal-50/50 border-teal-100 text-teal-700',
    amber: 'bg-amber-50/50 border-amber-100 text-amber-700',
  };

  const activeCount = items.filter(i => selected.includes(i.id)).length;

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
       <div className={cn("px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between", colors[color])}>
         <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-xs font-black">{title}</h4>
         </div>
         <span className="text-[10px] font-black bg-white/50 px-2 py-0.5 rounded-lg border border-white/40">{activeCount} من {items.length}</span>
       </div>
       <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
         {items.map(item => {
           const isActive = selected.includes(item.id);
           return (
             <div
               key={item.id}
               onClick={() => onToggle(item.id)}
               className={cn(
                 "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                 isActive
                   ? "border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/30"
                   : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
               )}
             >
                <div className="mt-0.5">
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isActive ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white")}>
                    {isActive && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
                <div>
                  <h5 className={cn("text-xs font-black", isActive ? "text-blue-900 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>{item.label}</h5>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
             </div>
           );
         })}
       </div>
    </div>
  );
}

// Missing icons for the file
import { Trash2, Activity, Archive, ShoppingBag, ShoppingBasket } from 'lucide-react';
