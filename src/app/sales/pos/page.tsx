'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CheckCircle2,
  Loader2,
  User,
  Stethoscope,
  Banknote,
  CreditCard,
  ReceiptText,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SalesRepository, type PosLine } from '@/core/pharmacy/sales_repository';
import { ContactsRepository } from '@/core/pharmacy/contacts_repository';
import { LookupsRepository } from '@/core/pharmacy/lookups_repository';
import { useSessionStore } from '@/core/state/useSessionStore';
import { piastersToEgp, PAYMENT_METHOD_LABELS, type Medicine, type Customer, type Doctor } from '@/types/pharmacy';

interface CartLine {
  key: string;
  medicineId: string;
  medicineName: string;
  barcode: string | null;
  unitLevel: number;
  unitName: string;
  quantity: number;
  unitPricePiasters: number;
  isTaxable: boolean;
  taxType: string | null;
  taxValue: number | null;
}

const egp = (piasters: number) =>
  piastersToEgp(piasters).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtQty = (n: number) => n.toLocaleString('ar-EG');

const calculateLineTax = (line: { isTaxable: boolean; taxType: string | null; taxValue: number | null; unitPricePiasters: number; quantity: number }) => {
  if (!line.isTaxable || !line.taxValue) return 0;
  const taxType = (line.taxType ?? '').toLowerCase();
  if (taxType.includes('percent') || taxType === 'percentage' || taxType === 'pct') {
    return Math.round(line.unitPricePiasters * line.quantity * (line.taxValue / 100));
  }
  return Math.round(line.taxValue * line.quantity);
};

export default function PosPage() {
  const { activeBranchId, session } = useSessionStore();
  const [branchId, setBranchId] = useState<string | null>(activeBranchId);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>('guest');
  const [doctorId, setDoctorId] = useState<string>('none');
  const [discountPiasters, setDiscountPiasters] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [cashReceivedPiasters, setCashReceivedPiasters] = useState(0);
  const [cardReceivedPiasters, setCardReceivedPiasters] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const requestId = useRef(0);

  const cashierId = session?.authUserId ?? '';
  const cashierName = session?.name ?? session?.email ?? '';

  useEffect(() => {
    if (activeBranchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchId(activeBranchId);
      return;
    }
    if (!branchId) {
      LookupsRepository.branches()
        .then((rows) => setBranchId(rows[0]?.id ?? null))
        .catch(() => setBranchId(null));
    }
  }, [activeBranchId, branchId]);

  useEffect(() => {
    if (!branchId) return;
    ContactsRepository.listCustomers({ branchId, page: 1, pageSize: 200 })
      .then((r) => setCustomers(r.items))
      .catch(() => setCustomers([]));
    LookupsRepository.doctors(branchId)
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [branchId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!branchId) return;
    const id = ++requestId.current;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled || id !== requestId.current) return;
      setIsSearching(true);
      const rows = await SalesRepository.listForPos(branchId, debouncedSearch).catch(() => []);
      if (cancelled || id !== requestId.current) return;
      setProducts(rows);
      setIsSearching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId, debouncedSearch]);

  const addToCart = useCallback((med: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.medicineId === med.id && l.unitLevel === 1);
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      const line: CartLine = {
        key: `${med.id}-u1-${Date.now()}`,
        medicineId: med.id,
        medicineName: med.name,
        barcode: med.barcode,
        unitLevel: 1,
        unitName: med.unit1_name ?? med.unit_name ?? 'وحدة',
        quantity: 1,
        unitPricePiasters: med.unit1_sell_price ?? med.sell_price_piasters ?? 0,
        isTaxable: Boolean(med.is_taxable),
        taxType: med.tax_type,
        taxValue: med.tax_value,
      };
      return [...prev, line];
    });
  }, []);

  const changeQuantity = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPiasters(0);
    setCashReceivedPiasters(0);
    setCardReceivedPiasters(0);
    setCustomerId('guest');
    setDoctorId('none');
    setPaymentMethod('cash');
  }, []);

  const subtotalPiasters = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPricePiasters * l.quantity, 0),
    [cart]
  );
  const taxPiasters = useMemo(() => cart.reduce((sum, l) => sum + calculateLineTax(l), 0), [cart]);
  const totalPiasters = Math.max(0, subtotalPiasters - discountPiasters + taxPiasters);
  const paidPiasters =
    paymentMethod === 'credit' ? 0 : cashReceivedPiasters + cardReceivedPiasters;
  const changePiasters = paymentMethod === 'credit' ? 0 : Math.max(0, paidPiasters - totalPiasters);
  const actualPaid = Math.min(paidPiasters, totalPiasters);

  const handleComplete = useCallback(async () => {
    if (!branchId) {
      toast.error('حدد الفرع أولاً.');
      return;
    }
    if (cart.length === 0) {
      toast.error('السلة فارغة.');
      return;
    }
    if (paymentMethod !== 'credit' && paidPiasters < totalPiasters) {
      toast.error('المبلغ المدفوع أقل من إجمالي الفاتورة.');
      return;
    }
    setIsSaving(true);
    try {
      const lines: PosLine[] = cart.map((l) => ({
        medicineId: l.medicineId,
        medicineName: l.medicineName,
        barcode: l.barcode,
        unitLevel: l.unitLevel,
        unitName: l.unitName,
        quantity: l.quantity,
        unitPricePiasters: l.unitPricePiasters,
      }));

      const selectedCustomer = customers.find((c) => c.id === customerId);
      const invoice = await SalesRepository.recordSale({
        accountId: session?.accountId ?? '',
        branchId,
        cashierId,
        cashierName,
        customerId: customerId === 'guest' ? null : customerId,
        customerName: customerId === 'guest' ? null : selectedCustomer?.name ?? null,
        customerPhone: customerId === 'guest' ? null : selectedCustomer?.phone ?? null,
        doctorId: doctorId === 'none' ? null : doctorId,
        lines,
        subtotalPiasters,
        discountPiasters,
        taxPiasters,
        totalPiasters,
        paidPiasters: actualPaid,
        paymentMethod: paymentMethod === 'credit' ? 'credit' : paymentMethod === 'card' ? 'card' : 'cash',
        cashReceivedPiasters: paymentMethod === 'credit' ? 0 : cashReceivedPiasters,
        cardReceivedPiasters: paymentMethod === 'credit' ? 0 : cardReceivedPiasters,
        notes: null,
      });
      setLastInvoice(invoice.invoice_number ?? null);
      toast.success(`تم حفظ فاتورة ${invoice.invoice_number ?? ''} بنجاح.`);
      window.dispatchEvent(new Event('falcon_data_changed'));
      clearCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر إتمام البيع.');
    } finally {
      setIsSaving(false);
    }
  }, [branchId, cart, customerId, doctorId, session, cashierId, cashierName, discountPiasters, taxPiasters, totalPiasters, paidPiasters, actualPaid, paymentMethod, cashReceivedPiasters, cardReceivedPiasters, subtotalPiasters, customers, clearCart]);

  return (
    <AppShell title="نقطة البيع" subtitle="شاشة البيع السريع">
      {lastInvoice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-4 py-3 mb-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex-1">
            تم حفظ فاتورة <span className="font-mono">{lastInvoice}</span>. يمكنك متابعة البيع أو البدء من جديد.
          </div>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setLastInvoice(null)}>
            إخفاء
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Products */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم، الاسم العلمي، أو الباركود ثم اضغط على الصنف لإضافته..."
                  className="pr-10 h-12 bg-slate-50 dark:bg-[#090e1a] rounded-xl text-sm font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-0">
              {isSearching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="p-12 flex flex-col items-center gap-2 text-slate-400">
                  <ShoppingCart className="w-8 h-8" />
                  <span className="text-xs font-bold">
                    {search ? 'لا توجد أصناف مطابقة للبحث.' : 'ابدأ بالبحث عن صنف لإضافته للسلة.'}
                  </span>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)] min-h-96">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                    {products.map((med) => {
                      const stock = Number(med.total_quantity_base_units ?? 0);
                      const price = med.unit1_sell_price ?? med.sell_price_piasters ?? 0;
                      const out = stock <= 0;
                      return (
                        <button
                          key={med.id}
                          disabled={out}
                          onClick={() => addToCart(med)}
                          className="text-right rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-lg dark:hover:border-emerald-500 bg-white dark:bg-[#111a2c] transition p-3 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:shadow-none flex flex-col gap-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{med.name}</p>
                              {med.generic_name && (
                                <p className="text-[10px] font-semibold text-slate-400 truncate">{med.generic_name}</p>
                              )}
                            </div>
                            {out ? (
                              <Badge variant="destructive" className="shrink-0">نفد</Badge>
                            ) : (
                              <Badge variant="success" className="shrink-0">متاح</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{egp(price)}</span>
                            <span className="text-[10px] font-bold text-slate-400">مخزون: {fmtQty(stock)}</span>
                          </div>
                          {med.barcode && (
                            <p className="text-[9px] font-mono text-slate-300 dark:text-slate-600 truncate">{med.barcode}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800 sticky top-20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">السلة</h3>
                  <Badge variant="outline">{cart.length}</Badge>
                </div>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-rose-500" onClick={clearCart}>
                    <Trash2 className="w-3.5 h-3.5" />
                    مسح
                  </Button>
                )}
              </div>

              <ScrollArea className="h-56">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400">
                    لا توجد أصناف في السلة بعد.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((line) => (
                      <div key={line.key} className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">{line.medicineName}</p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {egp(line.unitPricePiasters)} × {fmtQty(line.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => changeQuantity(line.key, -1)}>
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="w-8 text-center text-xs font-black">{fmtQty(line.quantity)}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => changeQuantity(line.key, 1)}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="w-16 text-left">
                          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                            {egp(line.unitPricePiasters * line.quantity)}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-rose-500" onClick={() => removeLine(line.key)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Customer / doctor */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> العميل
                  </Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger dir="rtl" className="mt-1 h-9 text-xs rounded-lg">
                      <SelectValue placeholder="عميل نقدي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">عميل نقدي</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> الطبيب
                  </Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger dir="rtl" className="mt-1 h-9 text-xs rounded-lg">
                      <SelectValue placeholder="بدون طبيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون طبيب</SelectItem>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Discount */}
              <div>
                <Label className="text-[10px] font-bold text-slate-500">الخصم (ج.م)</Label>
                <Input
                  type="number"
                  dir="ltr"
                  min={0}
                  step="0.01"
                  className="mt-1 h-9 rounded-lg text-left font-semibold"
                  value={piastersToEgp(discountPiasters)}
                  onChange={(e) => setDiscountPiasters(Math.max(0, Math.round((Number(e.target.value) || 0) * 100)))}
                  placeholder="0.00"
                />
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5 text-xs font-bold">
                <div className="flex justify-between text-slate-500">
                  <span>الإجمالي الفرعي</span>
                  <span>{egp(subtotalPiasters)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>الضريبة</span>
                  <span>{egp(taxPiasters)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>الخصم</span>
                  <span className="text-rose-500">- {egp(discountPiasters)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-black text-slate-800 dark:text-slate-100">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{egp(totalPiasters)}</span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <Label className="text-[10px] font-bold text-slate-500">طريقة الدفع</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['cash', 'card', 'credit'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-black transition ${
                        paymentMethod === method
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {method === 'cash' ? <Banknote className="w-4 h-4" /> : method === 'card' ? <CreditCard className="w-4 h-4" /> : <ReceiptText className="w-4 h-4" />}
                      {PAYMENT_METHOD_LABELS[method]}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'credit' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">المدفوع نقداً (ج.م)</Label>
                    <Input
                      type="number"
                      dir="ltr"
                      min={0}
                      step="0.01"
                      className="mt-1 h-9 rounded-lg text-left font-semibold"
                      value={piastersToEgp(cashReceivedPiasters)}
                      onChange={(e) => setCashReceivedPiasters(Math.max(0, Math.round((Number(e.target.value) || 0) * 100)))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">المدفوع بطاقة (ج.م)</Label>
                    <Input
                      type="number"
                      dir="ltr"
                      min={0}
                      step="0.01"
                      className="mt-1 h-9 rounded-lg text-left font-semibold"
                      value={piastersToEgp(cardReceivedPiasters)}
                      onChange={(e) => setCardReceivedPiasters(Math.max(0, Math.round((Number(e.target.value) || 0) * 100)))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'credit' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  فاتورة آجلة: سيُسجل المبلغ على حساب العميل بدون دفع الآن.
                </div>
              )}

              {paymentMethod !== 'credit' && (
                <div className="flex justify-between text-xs font-black text-slate-700 dark:text-slate-200">
                  <span>الباقي</span>
                  <span className={changePiasters >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {egp(changePiasters)}
                  </span>
                </div>
              )}

              <Button
                onClick={handleComplete}
                disabled={cart.length === 0 || isSaving}
                className="w-full h-12 rounded-xl text-sm font-black gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? 'جارٍ الحفظ...' : `إتمام البيع (${egp(totalPiasters)})`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}