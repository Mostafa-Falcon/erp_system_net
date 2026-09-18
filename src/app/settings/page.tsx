'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, Building2, Package, Receipt, Palette } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionStore } from '@/core/state/useSessionStore';
import { OrganizationRepository } from '@/core/pharmacy/organization_repository';
import type { AppSettings } from '@/types/pharmacy';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { session, activeBranchId } = useSessionStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const s = await OrganizationRepository.getSettings(session.accountId, activeBranchId);
      setSettings(s);
      if (s) {
        const flat: Record<string, string> = {};
        for (const [key, value] of Object.entries(s)) {
          if (value !== null && typeof value !== 'object') flat[key] = String(value);
        }
        setForm(flat);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر تحميل الإعدادات.');
    } finally {
      setIsLoading(false);
    }
  }, [session, activeBranchId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await OrganizationRepository.updateSettings(settings.id, {
        pharmacy_name: form.pharmacy_name || null,
        pharmacy_name_en: form.pharmacy_name_en || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        commercial_registry: form.commercial_registry || null,
        currency_symbol: form.currency_symbol || null,
        default_low_stock_threshold: form.default_low_stock_threshold ? Number(form.default_low_stock_threshold) : null,
        near_expiry_alert_days: form.near_expiry_alert_days ? Number(form.near_expiry_alert_days) : null,
        receipt_header_text: form.receipt_header_text || null,
        receipt_footer_notes: form.receipt_footer_notes || null,
        auto_print_receipt: form.auto_print_receipt === 'true',
        enable_expiry_tracking: form.enable_expiry_tracking === 'true',
        enable_expiry_automation: form.enable_expiry_automation === 'true',
        enable_vat: form.enable_vat === 'true',
        enable_dark_mode: form.enable_dark_mode === 'true',
        enable_sound_alerts: form.enable_sound_alerts === 'true',
      });
      toast.success('تم حفظ الإعدادات.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (label: string, field: string) => (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 cursor-pointer">
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="checkbox"
        checked={form[field] === 'true'}
        onChange={(e) => setForm((f) => ({ ...f, [field]: String(e.target.checked) }))}
        className="w-4.5 h-4.5 accent-violet-600"
      />
    </label>
  );

  const renderField = (label: string, field: string, placeholder?: string, type = 'text') => (
    <div className="space-y-2">
      <Label className="text-right block text-xs font-bold">{label}</Label>
      <Input type={type} value={form[field] ?? ''} onChange={set(field)} placeholder={placeholder} className="h-11 rounded-xl" />
    </div>
  );

  if (isLoading || !settings) {
    return (
      <AppShell title="الإعدادات" subtitle="إعدادات النظام">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-slate-200/80 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="h-5 w-40 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="الإعدادات"
      subtitle={settings.pharmacy_name || 'فالكون فارماسي'}
      actions={
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </Button>
      }
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-5 w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 rounded-xl">
          <TabsTrigger value="general" className="gap-2"><Building2 className="w-4 h-4" /> عام</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2"><Package className="w-4 h-4" /> المخزون</TabsTrigger>
          <TabsTrigger value="receipt" className="gap-2"><Receipt className="w-4 h-4" /> الإيصال</TabsTrigger>
          <TabsTrigger value="theme" className="gap-2"><Palette className="w-4 h-4" /> المظهر</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" /> بيانات المنشأة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('اسم الصيدلية (عربي)', 'pharmacy_name')}
              {renderField('اسم الصيدلية (إنجليزي)', 'pharmacy_name_en')}
              {renderField('الهاتف', 'phone')}
              {renderField('البريد الإلكتروني', 'email')}
              {renderField('العنوان', 'address')}
              {renderField('السجل التجاري', 'commercial_registry')}
              {renderField('رمز العملة', 'currency_symbol', 'ج.م')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Package className="w-4 h-4" /> إدارة المخزون
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('حد التنبيه المنخفض (افتراضي)', 'default_low_stock_threshold', undefined, 'number')}
              {renderField('أيام التنبيه قبل الانتهاء', 'near_expiry_alert_days', undefined, 'number')}
              <div className="sm:col-span-2 grid gap-3">
                {renderToggle('تفعيل تتبع صلاحية المنتجات', 'enable_expiry_tracking')}
                {renderToggle('تفعيل أتمتة الصلاحية (قفل المنتهي)', 'enable_expiry_automation')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Receipt className="w-4 h-4" /> إعدادات الإيصال
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              {renderField('نص رأس الإيصال', 'receipt_header_text')}
              {renderField('ملاحظات تذييل الإيصال', 'receipt_footer_notes')}
              <div className="grid gap-3 pt-2">
                {renderToggle('طباعة تلقائية للإيصال', 'auto_print_receipt')}
                {renderToggle('تفعيل الضريبة', 'enable_vat')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Palette className="w-4 h-4" /> المظهر والتنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {renderToggle('الوضع الداكن', 'enable_dark_mode')}
              {renderToggle('التنبيهات الصوتية', 'enable_sound_alerts')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}