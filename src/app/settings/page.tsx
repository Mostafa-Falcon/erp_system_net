'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { useSessionStore } from '@/core/state/useSessionStore';
import { useSyncStore } from '@/core/state/useSyncStore';
import { SettingsRepository } from '@/modules/settings/settings_repository';
import { formatDateTime } from '@/lib/format';
import { ScaleManager } from '@/lib/scale_manager';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { toast } from 'sonner';
import { Scale, Download, Wifi, Cpu, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { Branch } from '@/types';

const selectCls =
  'w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const CURRENCIES = ['EGP', 'SAR', 'AED', 'USD', 'EUR', 'KWD', 'QAR', 'OMR', 'BHD', 'JOD', 'LYD', 'TND'];

function SettingsContent() {
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const { isOnline, isSyncing, pendingCount, lastSyncedAt, updatePendingCount, triggerSync } = useSyncStore();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [oName, setOName] = useState('');
  const [oLegalName, setOLegalName] = useState('');
  const [oTaxNumber, setOTaxNumber] = useState('');
  const [oCommercialNo, setOCommercialNo] = useState('');
  const [oCurrency, setOCurrency] = useState('EGP');
  const [oPhone, setOPhone] = useState('');
  const [oEmail, setOEmail] = useState('');
  const [oAddress, setOAddress] = useState('');

  // Settings form
  const [vatRate, setVatRate] = useState('14');
  const [allowNegative, setAllowNegative] = useState(false);

  // إعدادات الموازين الإلكترونية
  const [scaleEnabled, setScaleEnabled] = useState(true);
  const [scaleMode, setScaleMode] = useState<'barcode' | 'serial' | 'both'>('both');
  const [scalePrefix, setScalePrefix] = useState('99');
  const [scaleType, setScaleType] = useState<'weight' | 'price'>('weight');
  const [scalePluLength, setScalePluLength] = useState('5');
  const [scaleWeightDecimals, setScaleWeightDecimals] = useState('3');
  const [scaleIp, setScaleIp] = useState('192.168.1.150');
  const [scalePort, setScalePort] = useState('4001');
  const [scaleBaudRate, setScaleBaudRate] = useState('9600');
  const [isSavingScale, setIsSavingScale] = useState(false);
  const [isExportingPlu, setIsExportingPlu] = useState(false);
  const [liveWeightResult, setLiveWeightResult] = useState<string | null>(null);
  const [isReadingWeight, setIsReadingWeight] = useState(false);

  // Branch form
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bIsMain, setIsBIsMain] = useState(false);

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const loadData = async () => {
    if (!orgId) return;
    try {
      const [orgRec, settings, branchList, scaleCfg] = await Promise.all([
        SettingsRepository.getOrganization(orgId),
        SettingsRepository.getAppSettings(orgId),
        SettingsRepository.getBranches(orgId),
        ScaleManager.getConfig(orgId),
      ]);
      setBranches(branchList);

      setOName(orgRec?.name || '');
      setOLegalName(orgRec?.legal_name || '');
      setOTaxNumber(orgRec?.tax_number || '');
      setOCommercialNo(orgRec?.commercial_reg_no || '');
      setOCurrency(orgRec?.currency || 'EGP');
      setOPhone(orgRec?.phone || '');
      setOEmail(orgRec?.email || '');
      setOAddress(orgRec?.address || '');

      const vat = settings.find((s) => s.id === 'vat_rate');
      const neg = settings.find((s) => s.id === 'allow_negative_stock');
      setVatRate(vat?.value ?? '14');
      setAllowNegative(neg?.value === 'true');

      // Scale config
      setScaleEnabled(scaleCfg.enabled);
      setScaleMode(scaleCfg.mode);
      setScalePrefix(scaleCfg.barcodePrefix);
      setScaleType(scaleCfg.barcodeType);
      setScalePluLength(String(scaleCfg.pluLength));
      setScaleWeightDecimals(String(scaleCfg.weightDecimals));
      setScaleIp(scaleCfg.scaleIp);
      setScalePort(scaleCfg.scalePort);
      setScaleBaudRate(String(scaleCfg.baudRate));
    } catch (err) {
      console.error('Load settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.resolve().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    Promise.resolve().then(updatePendingCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveOrg = async () => {
    setFormError('');
    setSavedNotice('');
    if (!oName.trim()) {
      setFormError('أدخل اسم المؤسسة.');
      return;
    }
    setIsSaving(true);
    try {
      await SettingsRepository.updateOrganization(orgId, {
        name: oName.trim(),
        legal_name: oLegalName.trim() || undefined,
        tax_number: oTaxNumber.trim() || undefined,
        commercial_reg_no: oCommercialNo.trim() || undefined,
        currency: oCurrency.trim() || 'EGP',
        phone: oPhone.trim() || undefined,
        email: oEmail.trim() || undefined,
        address: oAddress.trim() || undefined,
      });
      setSavedNotice('تم حفظ بيانات المؤسسة بنجاح.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async () => {
    setFormError('');
    setSavedNotice('');
    setIsSaving(true);
    try {
      const vat = Math.max(0, Math.min(100, Number(vatRate) || 0));
      await SettingsRepository.setSetting(orgId, 'vat_rate', String(vat), 'نسبة ضريبة القيمة المضافة الافتراضية (%)');
      await SettingsRepository.setSetting(orgId, 'allow_negative_stock', String(allowNegative), 'السماح بالبيع بالسالب');
      setVatRate(String(vat));
      setSavedNotice('تم حفظ إعدادات النظام بنجاح.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveScaleSettings = async () => {
    setIsSavingScale(true);
    try {
      await ScaleManager.saveConfig(orgId, {
        enabled: scaleEnabled,
        mode: scaleMode,
        barcodePrefix: scalePrefix,
        barcodeType: scaleType,
        pluLength: parseInt(scalePluLength, 10) || 5,
        weightDecimals: parseInt(scaleWeightDecimals, 10) || 3,
        scaleIp,
        scalePort,
        baudRate: parseInt(scaleBaudRate, 10) || 9600,
      });
      toast.success('تم حفظ إعدادات الموازين الإلكترونية بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حفظ إعدادات الموازين');
    } finally {
      setIsSavingScale(false);
    }
  };

  const handleExportPlu = async () => {
    setIsExportingPlu(true);
    try {
      const prods = await ProductRepository.getAll(orgId);
      ScaleManager.downloadPluFile(prods);
      toast.success('تم تصدير وتحميل ملف الأصناف الموزونة بنجاح (PLU CSV)');
    } catch {
      toast.error('حدث خطأ أثناء تصدير ملف الميزان');
    } finally {
      setIsExportingPlu(false);
    }
  };

  const handleTestLiveScale = async () => {
    setIsReadingWeight(true);
    setLiveWeightResult(null);
    try {
      const res = await ScaleManager.readLiveWeightFromSerial(parseInt(scaleBaudRate, 10) || 9600);
      if (res.success && res.weight !== undefined) {
        setLiveWeightResult(`${res.weight.toFixed(3)} كجم`);
        toast.success(`تم قراءة الوزن بنجاح من الميزان: ${res.weight.toFixed(3)} كجم`);
      } else {
        setLiveWeightResult(`فشل: ${res.error || 'تعذر القراءة'}`);
        toast.error(res.error || 'تعذر قراءة الوزن من الميزان');
      }
    } catch (err: any) {
      setLiveWeightResult(`خطأ: ${err?.message || 'فشل الاتصال'}`);
      toast.error(err?.message || 'حدث خطأ أثناء الاتصال بالميزان');
    } finally {
      setIsReadingWeight(false);
    }
  };

  const createBranch = async () => {
    setFormError('');
    setSavedNotice('');
    if (!bName.trim()) {
      setFormError('أدخل اسم الفرع.');
      return;
    }
    setIsSaving(true);
    try {
      await SettingsRepository.createBranch({
        orgId,
        name: bName,
        phone: bPhone || undefined,
        address: bAddress || undefined,
        isMain: bIsMain || branches.length === 0,
      });
      setBName('');
      setBPhone('');
      setBAddress('');
      setIsBIsMain(false);
      await loadData();
      setSavedNotice('تم إضافة الفرع بنجاح.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الفرع.');
    } finally {
      setIsSaving(false);
    }
  };

  const setMainBranch = async (id: string) => {
    try {
      await SettingsRepository.setMainBranch(id, orgId);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ.');
    }
  };

  const toggleBranch = async (id: string) => {
    try {
      await SettingsRepository.toggleBranchActive(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ أثناء تحديث الفرع.');
    }
  };

  return (
    <AppShell title="إعدادات المؤسسة" subtitle="بيانات المنشأة، إعدادات النظام، الفروع، وحالة المزامنة مع السحابة">
      <div className="space-y-4">
        {formError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
            {formError}
          </div>
        )}
        {savedNotice && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {savedNotice}
          </div>
        )}

        {/* Organization profile */}
        <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
          <SectionTitle title="بيانات المؤسسة" subtitle="الاسم التجاري والبيانات القانونية والعملة" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="اسم المؤسسة *">
              <Input type="text" value={oName} onChange={(e) => setOName(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="الاسم القانوني">
              <Input type="text" value={oLegalName} onChange={(e) => setOLegalName(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="العملة">
              <select value={oCurrency} onChange={(e) => setOCurrency(e.target.value)} className={selectCls}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="الرقم الضريبي">
              <Input type="text" value={oTaxNumber} onChange={(e) => setOTaxNumber(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="السجل التجاري">
              <Input type="text" value={oCommercialNo} onChange={(e) => setOCommercialNo(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="الهاتف">
              <Input type="text" value={oPhone} onChange={(e) => setOPhone(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="البريد الإلكتروني">
              <Input type="email" value={oEmail} onChange={(e) => setOEmail(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="العنوان">
              <Input type="text" value={oAddress} onChange={(e) => setOAddress(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveOrg} disabled={isSaving || isLoading} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold">
              {isSaving ? 'جارِ الحفظ...' : 'حفظ بيانات المؤسسة'}
            </Button>
          </div>
        </section>

        {/* System settings */}
        <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
          <SectionTitle title="إعدادات النظام" subtitle="القيم الافتراضية للعمليات — الضريبة والرصيد بالسالب" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={`ضريبة القيمة المضافة (%) — الحالية: ${vatRate}%`}>
              <Input type="number" min={0} max={100} step="any" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">السماح بالبيع بالسالب (رصيد سالب)</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setAllowNegative((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${allowNegative ? 'bg-[#558b2f]' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${allowNegative ? 'right-0.5' : 'right-[22px]'}`} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{allowNegative ? 'مفعل (يُسمح بالسالب عند التحذير فقط)' : 'معطل (يمنع البيع بدون رصيد)'}</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={isSaving || isLoading} className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold">
              {isSaving ? 'جارِ الحفظ...' : 'حفظ إعدادات النظام'}
            </Button>
          </div>
        </section>

        {/* Electronic Scales Settings */}
        <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">إعدادات الموازين الإلكترونية (Electronic Scales)</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  تهيئة الربط التلقائي مع موازين الباركود الملصق (CAS, Rongta, Dibal) وموازين الكاشير المباشرة عبر USB والسيريال
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setScaleEnabled((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${scaleEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${scaleEnabled ? 'right-0.5' : 'right-[22px]'}`} />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {scaleEnabled ? 'الربط مفعل' : 'الربط معطل'}
                </span>
              </label>
            </div>
          </div>

          {/* نمط التشغيل */}
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              نمط تشغيل الموازين
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'both', label: 'كلاهما (باركود وميزان مباشر)', desc: 'دعم الباركود المطبوع وقراءة الوزن المباشر' },
                { id: 'barcode', label: 'ميزان باركود ملصقات فقط', desc: 'تفكيك باركود EAN-13 المطبوع من الميزان بالـ POS' },
                { id: 'serial', label: 'ميزان كاشير مباشر فقط', desc: 'قراءة الوزن المباشر من ميزان الكاشير USB / Serial' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setScaleMode(m.id as any)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    scaleMode === m.id
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-black">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* تفاصيل ميزان الباركود */}
          {(scaleMode === 'barcode' || scaleMode === 'both') && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  إعدادات باركود الميزان (EAN-13 Scale Barcode)
                </span>
                <Button
                  type="button"
                  onClick={handleExportPlu}
                  disabled={isExportingPlu}
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingPlu ? 'جاري التصدير...' : 'تصدير ملف الأصناف للميزان (PLU CSV)'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="بادئة الباركود (Prefix) *">
                  <Input
                    type="text"
                    value={scalePrefix}
                    onChange={(e) => setScalePrefix(e.target.value)}
                    placeholder="99 أو 20"
                    className="h-10 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-emerald-600"
                  />
                </Field>

                <Field label="نوع التشفير بالباركود *">
                  <select
                    value={scaleType}
                    onChange={(e) => setScaleType(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="weight">مشفّر بالوزن (99 + كود الصنف + الوزن + C)</option>
                    <option value="price">مشفّر بالقيمة الإجمالية (99 + كود الصنف + السعر + C)</option>
                  </select>
                </Field>

                <Field label="عدد خانات كود الصنف (PLU Digits)">
                  <select
                    value={scalePluLength}
                    onChange={(e) => setScalePluLength(e.target.value)}
                    className={selectCls}
                  >
                    <option value="4">4 أرقام (مثال: 0012)</option>
                    <option value="5">5 أرقام (مثال: 00012 - افتراضي)</option>
                    <option value="6">6 أرقام (مثال: 000012)</option>
                  </select>
                </Field>

                <Field label="الخانات العشرية للوزن">
                  <select
                    value={scaleWeightDecimals}
                    onChange={(e) => setScaleWeightDecimals(e.target.value)}
                    className={selectCls}
                  >
                    <option value="3">3 أرقام عشرية (جرام: 01500 = 1.500 كجم)</option>
                    <option value="2">رقمين عشريين (0150 = 1.50 كجم)</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <Field label="عنوان IP الميزان بالشبكة (اختياري)">
                  <Input
                    type="text"
                    value={scaleIp}
                    onChange={(e) => setScaleIp(e.target.value)}
                    placeholder="192.168.1.150"
                    className="h-10 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </Field>
                <Field label="منفذ الميزان بالشبكة (Port)">
                  <Input
                    type="text"
                    value={scalePort}
                    onChange={(e) => setScalePort(e.target.value)}
                    placeholder="4001"
                    className="h-10 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* تفاصيل ميزان الكاشير المباشر */}
          {(scaleMode === 'serial' || scaleMode === 'both') && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  إعدادات ميزان الكاشير المباشر (USB / Serial Direct Scale)
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  يعمل عبر Web Serial API مباشرة مع المتصفح
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Field label="سرعة منفذ السيريال (Baud Rate)">
                  <select
                    value={scaleBaudRate}
                    onChange={(e) => setScaleBaudRate(e.target.value)}
                    className={selectCls}
                  >
                    <option value="4800">4800 bps</option>
                    <option value="9600">9600 bps (الأكثر شيوعاً للموازين)</option>
                    <option value="19200">19200 bps</option>
                    <option value="38400">38400 bps</option>
                  </select>
                </Field>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleTestLiveScale}
                    disabled={isReadingWeight}
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Scale className="w-4 h-4" />
                    {isReadingWeight ? 'جاري قراءة الميزان...' : 'تجربة قراءة الوزن المباشر ⚖️'}
                  </Button>

                  {liveWeightResult && (
                    <div className="h-10 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {liveWeightResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={saveScaleSettings}
              disabled={isSavingScale}
              className="h-10 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSavingScale ? 'جاري الحفظ...' : 'حفظ إعدادات الموازين الإلكترونية'}
            </Button>
          </div>
        </section>

        {/* Branches */}
        <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
          <SectionTitle title="الفروع" subtitle="مخازن وفروع المنشأة — المستخدمون مرتبطون بفروعهم" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <Field label="اسم الفرع *">
              <Input type="text" value={bName} onChange={(e) => setBName(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="الهاتف">
              <Input type="text" value={bPhone} onChange={(e) => setBPhone(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <Field label="العنوان">
              <Input type="text" value={bAddress} onChange={(e) => setBAddress(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 text-xs" />
            </Field>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer h-10 text-xs font-bold text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={bIsMain || branches.length === 0} disabled={branches.length === 0} onChange={(e) => setIsBIsMain(e.target.checked)} className="w-4 h-4 accent-[#558b2f]" />
                فرع رئيسي
              </label>
              <Button onClick={createBranch} disabled={isSaving} className="h-10 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Icons.Plus /> إضافة فرع
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400">
                  <th className="py-2.5 pr-3">الفرع</th>
                  <th className="py-2.5">الكود</th>
                  <th className="py-2.5">الهاتف</th>
                  <th className="py-2.5">العنوان</th>
                  <th className="py-2.5">الحالة</th>
                  <th className="py-2.5 pl-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <td className="py-3 pr-3">
                      <span className="text-slate-900 dark:text-white">{b.name}</span>
                      {b.is_main && <span className="mr-2 rounded-full bg-[#558b2f]/10 text-[#558b2f] dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black">رئيسي</span>}
                    </td>
                    <td className="py-3 font-mono text-[11px]">{b.code}</td>
                    <td className="py-3 text-[11px]">{b.phone || '—'}</td>
                    <td className="py-3 text-[11px]">{b.address || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${b.is_active ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
                        {b.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center justify-end gap-1">
                        {!b.is_main && (
                          <button onClick={() => setMainBranch(b.id)} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-[10px] font-bold cursor-pointer">
                            جعلها رئيسية
                          </button>
                        )}
                        <button onClick={() => toggleBranch(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer" title={b.is_active ? 'إيقاف' : 'تفعيل'}>
                          <Icons.X />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs font-bold text-slate-400">لا توجد فروع بعد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sync status */}
        <section className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
          <SectionTitle title="حالة المزامنة السحابية" subtitle="تزامن البيانات المحلية مع سحابة Supabase" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black border ${isOnline ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300'}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                {isOnline ? 'متصل بالسحابة' : 'غير متصل — الوضع المحلي يعمل'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300">
                <Icons.ClockHistory /> {pendingCount} عملية بانتظار المزامنة
              </span>
              <Button onClick={() => triggerSync()} disabled={isSyncing || !isOnline} className="h-9 px-4 bg-[#558b2f] hover:bg-[#436d25] text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                <Icons.Refresh /> {isSyncing ? 'جارِ المزامنة...' : 'مزامنة الآن'}
              </Button>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              آخر مزامنة ناجحة: {lastSyncedAt ? formatDateTime(lastSyncedAt) : 'لم تتم بعد'}
            </span>
          </div>
          {pendingCount > 0 && (
            <p className={`text-[11px] font-bold ${isOnline ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
              {isOnline ? 'يتم رفع العمليات المعلقة تلقائياً — يمكنك الضغط على "مزامنة الآن" للتسريع.' : 'عند عودة الاتصال ستتم المزامنة تلقائياً (استرجاع البيانات أولاً ثم رفع العمليات).'}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}