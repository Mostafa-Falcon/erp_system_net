'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Pill, ChevronRight, ChevronLeft, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormDialog, type FormField, type FormValues } from '@/components/data/FormDialog';
import { useActiveAccountId, useSessionStore } from '@/core/state/useSessionStore';
import { MedicinesRepository, type MedicineQuickFilter } from '@/core/pharmacy/medicines_repository';
import { LookupsRepository } from '@/core/pharmacy/lookups_repository';
import { piastersToEgp, type Medicine, type MedicineInsert } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

const FILTERS: Array<{ value: MedicineQuickFilter; label: string }> = [
  { value: 'all', label: 'كل الأصناف' },
  { value: 'low_stock', label: 'مخزون منخفض' },
  { value: 'out_of_stock', label: 'نفد المخزون' },
  { value: 'expiring_soon', label: 'قاربت الصلاحية' },
];

const fmt = (piasters: number | null | undefined) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Builds a medicines insert payload from EGP-based form values. */
const buildMedicineInsert = (
  accountId: string,
  branchId: string,
  values: FormValues,
  lookups: { categories: Array<{ id: string; name: string }>; brands: Array<{ id: string; name: string }>; types: Array<{ id: string; name: string }>; groups: Array<{ id: string; name: string }> }
): MedicineInsert => {
  const buyEgp = Number(values.buy_price) || 0;
  const sellEgp = Number(values.sell_price) || 0;
  const buyPiasters = Math.round(buyEgp * 100);
  const sellPiasters = Math.round(sellEgp * 100);

  const category = lookups.categories.find((c) => c.id === values.category_id);
  const brand = lookups.brands.find((b) => b.id === values.brand_id);
  const productType = lookups.types.find((t) => t.id === values.product_type_id);
  const group = lookups.groups.find((g) => g.id === values.therapeutic_group_id);

  return {
    id: crypto.randomUUID(),
    account_id: accountId,
    branch_id: branchId,
    name: String(values.name ?? ''),
    name_ar: (values.name_ar as string) || null,
    name_en: (values.name_en as string) || null,
    generic_name: (values.generic_name as string) || null,
    barcode: (values.barcode as string) || null,
    category_id: category?.id ?? null,
    category_name: category?.name ?? null,
    brand_id: brand?.id ?? null,
    brand_name: brand?.name ?? null,
    product_type_id: productType?.id ?? null,
    product_type_name: productType?.name ?? null,
    therapeutic_group_id: group?.id ?? null,
    therapeutic_group_name: group?.name ?? null,
    manufacturer: (values.manufacturer as string) || null,
    dosage_form: (values.dosage_form as string) || null,
    strength: (values.strength as string) || null,
    package_size: (values.package_size as string) || null,
    shelf_location: (values.shelf_location as string) || null,
    unit_name: (values.unit_name as string) || 'عبوة',
    unit1_name: (values.unit_name as string) || 'عبوة',
    buy_price_piasters: buyPiasters,
    sell_price_piasters: sellPiasters,
    unit1_buy_price: buyPiasters,
    unit1_sell_price: sellPiasters,
    min_reorder_level: (values.min_reorder_level as number) || 0,
    opening_quantity: 0,
    opening_cost_piasters: 0,
    total_quantity: 0,
    total_quantity_base_units: 0,
    is_taxable: Boolean(values.is_taxable),
    is_active: true,
    is_quick_item: false,
    is_sales_suspended: false,
    expiry_tracking_enabled: Boolean(values.expiry_tracking_enabled),
    expiry_alert_enabled: Boolean(values.expiry_tracking_enabled),
    notes: (values.notes as string) || null,
  };
};

export default function MedicinesPage() {
  const { activeBranchId } = useSessionStore();
  const accountId = useActiveAccountId();

  const [branchId, setBranchId] = useState<string | null>(activeBranchId);
  const [items, setItems] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<MedicineQuickFilter>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [therapeuticGroups, setTherapeuticGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (activeBranchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchId(activeBranchId);
      return;
    }
    if (branchId) return;
    LookupsRepository.branches()
      .then((rows) => setBranchId(rows[0]?.id ?? null))
      .catch(() => setBranchId(null));
  }, [activeBranchId, branchId]);

  useEffect(() => {
    LookupsRepository.categories()
      .then((rows) => setCategories(rows.map((c) => ({ id: c.id, name: c.name ?? '' }))))
      .catch(() => setCategories([]));
    LookupsRepository.brands()
      .then((rows) => setBrands(rows.map((b) => ({ id: b.id, name: b.name ?? '' }))))
      .catch(() => setBrands([]));
    LookupsRepository.productTypes()
      .then((rows) => setProductTypes(rows.map((p) => ({ id: p.id, name: p.name ?? '' }))))
      .catch(() => setProductTypes([]));
    LookupsRepository.therapeuticGroups()
      .then((rows) => setTherapeuticGroups(rows.map((g) => ({ id: g.id, name: g.name ?? '' }))))
      .catch(() => setTherapeuticGroups([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!branchId) {
      setIsLoading(false);
      return;
    }
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await MedicinesRepository.listFiltered({
        branchId,
        filter,
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
        expiringDays: 90,
      });
      if (id !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'تعذّر تحميل قائمة الأدوية.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [branchId, filter, debouncedSearch, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener('falcon_data_changed', load);
    return () => window.removeEventListener('falcon_data_changed', load);
  }, [load]);

  const visibleItems = categoryId === 'all' ? items : items.filter((m) => m.category_id === categoryId);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const medicineFields: FormField[] = [
    { name: 'name', label: 'اسم الدواء', required: true, placeholder: 'مثال: بانادول إكسترا' },
    { name: 'name_ar', label: 'الاسم العربي' },
    { name: 'name_en', label: 'الاسم الإنجليزي', dir: 'ltr' },
    { name: 'generic_name', label: 'الاسم العلمي', dir: 'ltr' },
    { name: 'barcode', label: 'الباركود', dir: 'ltr' },
    { name: 'category_id', label: 'التصنيف', type: 'select', options: categories.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'brand_id', label: 'الشركة المصنعة', type: 'select', options: brands.map((b) => ({ value: b.id, label: b.name })) },
    { name: 'product_type_id', label: 'نوع المنتج', type: 'select', options: productTypes.map((p) => ({ value: p.id, label: p.name })) },
    { name: 'therapeutic_group_id', label: 'المجموعة العلاجية', type: 'select', options: therapeuticGroups.map((g) => ({ value: g.id, label: g.name })) },
    { name: 'manufacturer', label: 'المصنع', dir: 'ltr' },
    { name: 'dosage_form', label: 'الشكل الصيدلاني', placeholder: 'مثال: أقراص' },
    { name: 'strength', label: 'التركيز', placeholder: 'مثال: 500 مجم' },
    { name: 'package_size', label: 'حجم العبوة', placeholder: 'مثال: 20 قرص' },
    { name: 'shelf_location', label: 'مكان الرف', placeholder: 'مثال: رف 3' },
    { name: 'unit_name', label: 'اسم الوحدة', placeholder: 'مثال: علبة' },
    { name: 'buy_price', label: 'سعر الشراء (ج.م)', type: 'number', step: '0.01', placeholder: '0.00' },
    { name: 'sell_price', label: 'سعر البيع (ج.م)', type: 'number', step: '0.01', placeholder: '0.00' },
    { name: 'min_reorder_level', label: 'حد إعادة الطلب', type: 'number', placeholder: 'مثال: 10' },
    { name: 'expiry_tracking_enabled', label: 'تتبع الصلاحية؟', type: 'switch', hint: 'تفعيل تتبع تواريخ انتهاء الصلاحية' },
    { name: 'is_taxable', label: 'خاضع للضريبة؟', type: 'switch', hint: 'يُحتسب على هذا الصنف ضريبة عند البيع' },
    { name: 'notes', label: 'ملاحظات', type: 'textarea', fullWidth: true },
  ];

  const handleCreateMedicine = async (values: FormValues) => {
    if (!accountId || !branchId) throw new Error('حدد الفرع أولاً.');
    const payload = buildMedicineInsert(accountId, branchId, values, {
      categories,
      brands,
      types: productTypes,
      groups: therapeuticGroups,
    });
    await MedicinesRepository.create(payload);
  };

  return (
    <AppShell
      title="الأدوية والأصناف"
      subtitle={`إجمالي ${total.toLocaleString('ar-EG')} صنف مسجل بالفرع المحدد`}
      actions={
        <>
          <FormDialog
            title="إضافة دواء / صنف"
            subtitle="أدخل بيانات الصنف الجديد"
            fields={medicineFields}
            onSubmit={handleCreateMedicine}
          />
          <Button variant="outline" onClick={load} className="gap-2 rounded-xl">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            تحديث
          </Button>
        </>
      }
    >
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الاسم العلمي، أو الباركود..."
              className="pr-10 h-11 bg-slate-50 dark:bg-[#090e1a] rounded-xl"
            />
          </div>
          <div className="w-full lg:w-52">
            <Select value={filter} onValueChange={(v) => { setFilter(v as MedicineQuickFilter); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="عرض" />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full lg:w-52">
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التصنيفات</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>الباركود</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>سعر الشراء</TableHead>
                <TableHead>سعر البيع</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((__, c) => (
                      <TableCell key={c}><div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              )}

              {!isLoading && visibleItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package className="w-8 h-8" />
                      <span className="text-xs font-bold">لا توجد أصناف مطابقة.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && visibleItems.map((m) => {
                const qty = Number(m.total_quantity_base_units ?? 0);
                const reorder = Number(m.min_reorder_level ?? 0);
                const isLow = qty > 0 && qty <= reorder;
                const isOut = qty <= 0;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Pill className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{m.name}</p>
                          {(m.generic_name || m.name_en) && (
                            <p className="text-[10px] font-semibold text-slate-400 truncate">{m.generic_name || m.name_en}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-500">{m.barcode || '-'}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-500">{m.unit_name || '-'}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmt(m.buy_price_piasters)}</TableCell>
                    <TableCell className="text-xs font-black text-emerald-600 dark:text-emerald-400">{fmt(m.sell_price_piasters)}</TableCell>
                    <TableCell className="text-xs font-black text-slate-700 dark:text-slate-200">{qty.toLocaleString('ar-EG')}</TableCell>
                    <TableCell>
                      {isOut ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />نفد</Badge>
                      ) : isLow ? (
                        <Badge variant="warning" className="gap-1"><AlertTriangle className="w-3 h-3" />منخفض</Badge>
                      ) : (
                        <Badge variant="success">متاح</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">
              صفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" /> السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1 rounded-lg"
              >
                التالي <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
