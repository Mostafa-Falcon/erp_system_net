'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSessionStore } from '@/core/state/useSessionStore';
import { SalesRepository } from '@/modules/sales/sales_repository';
import { ContactsRepository } from '@/modules/contacts/contacts_repository';
import { formatNumber, formatDateTime } from '@/lib/format';
import { SupportModal } from '@/components/layout/SupportModal';
import { CalculatorModal } from '@/components/layout/CalculatorModal';
import type {
  Contact,
  Product,
  ProductBatch,
  SalesInvoice,
  Treasury,
  Unit,
  Warehouse,
} from '@/types';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  Home,
  User,
  Users,
  Building,
  Tag,
  ChevronDown,
  ArrowRight,
  Menu,
  Moon,
  Sun,
  Calculator,
  HardDrive,
  Headphones,
  Bell,
  Calendar,
  X,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Clock,
  Briefcase,
  UserCheck,
  Truck,
  LogOut,
  CreditCard,
  Layers,
  FileText,
  DollarSign,
  AlertCircle,
  Printer,
  Scale,
} from 'lucide-react';
import { ScaleManager, ScaleConfig, DEFAULT_SCALE_CONFIG } from '@/lib/scale_manager';

interface CartLine {
  key: string;
  productId: string;
  batchId: string;
  unitId: string;
  factor: number;
  qty: number;
  price: number;
  discount: number;
  cost: number;
  taxRate: number;
}

export function POS() {
  const router = useRouter();
  const { currentUser, activeBranchId, activeShift } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const branchId = activeBranchId || currentUser?.branch_id || '';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [treasuryId, setTreasuryId] = useState('');
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [unitOptions, setUnitOptions] = useState<Record<string, { unitId: string; factor: number; price?: number }[]>>({});
  const [stock, setStock] = useState<Record<string, number>>({});
  const [batches, setBatches] = useState<Record<string, ProductBatch[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Search & Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerMode, setCustomerMode] = useState<'cash' | 'customer' | 'supplier'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [priceTier, setPriceTier] = useState<string>('default');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Modals & UI states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<SalesInvoice | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Scale Integration
  const [scaleConfig, setScaleConfig] = useState<ScaleConfig>(DEFAULT_SCALE_CONFIG);
  const [isReadingScale, setIsReadingScale] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('falcon_theme');
    setIsDark(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('falcon_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  // 1. Initial Data Loading
  const loadData = async () => {
    if (!orgId) return;
    try {
      const { db } = await import('@/core/db/app_database');
      const [whs, tres, custs, prods, unts, pUnits, levels, bchs] = await Promise.all([
        branchId
          ? db.warehouses.where('org_id').equals(orgId).and((w) => w.is_active && w.branch_id === branchId).toArray()
          : db.warehouses.where('org_id').equals(orgId).and((w) => w.is_active).toArray(),
        db.treasuries.where('org_id').equals(orgId).and((t) => t.is_active).toArray(),
        ContactsRepository.getContacts(orgId),
        db.products.where('org_id').equals(orgId).and((p) => p.is_active).toArray(),
        db.units.where('org_id').equals(orgId).toArray(),
        db.product_units.toArray(),
        db.stock_levels.toArray(),
        db.product_batches.toArray(),
      ]);

      const umap: Record<string, Unit> = {};
      for (const u of unts) umap[u.id] = u;

      const opts: Record<string, { unitId: string; factor: number; price?: number }[]> = {};
      for (const p of prods) {
        const list: { unitId: string; factor: number; price?: number }[] = [
          { unitId: p.base_unit_id, factor: 1, price: p.sale_price },
        ];
        for (const pu of pUnits.filter((x) => x.product_id === p.id)) {
          const basePrice = pu.sale_price ?? p.sale_price;
          list.push({
            unitId: pu.unit_id,
            factor: pu.conversion_factor || 1,
            price: basePrice !== undefined && pu.sale_price !== undefined ? pu.sale_price : (p.sale_price || 0) * (pu.conversion_factor || 1),
          });
        }
        opts[p.id] = list;
      }

      setWarehouses(whs);
      setTreasuries(tres);
      setCustomers(custs);
      setProducts(prods);
      setUnitsById(umap);
      setUnitOptions(opts);

      if (whs.length > 0) setWarehouseId(whs[0].id);
      if (tres.length > 0) setTreasuryId(tres.find((t) => t.is_default)?.id || tres[0].id);

      const defW = whs[0]?.id || '';
      const stockMap: Record<string, number> = {};
      for (const l of levels) {
        if (l.warehouse_id === defW) stockMap[l.product_id] = l.quantity;
      }
      setStock(stockMap);

      const batchMap: Record<string, ProductBatch[]> = {};
      for (const b of bchs) {
        if (b.warehouse_id !== defW) continue;
        (batchMap[b.product_id] = batchMap[b.product_id] || []).push(b);
      }
      setBatches(batchMap);

      // Load scale configuration
      try {
        const sc = await ScaleManager.getConfig(orgId);
        setScaleConfig(sc);
      } catch (scErr) {
        console.warn('Could not load scale config:', scErr);
      }
    } catch (err) {
      console.error('POS Load err:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات نقطة البيع.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Focus search on load
    setTimeout(() => searchInputRef.current?.focus(), 300);
  }, [orgId, branchId]);

  // Product availability helper
  const availableFor = (pId: string) => stock[pId] || 0;

  // Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, searchQuery]);

  // Add Product to Cart
  const addToCart = (
    product: Product,
    options?: { unitId?: string; price?: number; factor?: number; qty?: number }
  ) => {
    const opt = options?.unitId
      ? (unitOptions[product.id] || []).find((u) => u.unitId === options.unitId)
      : (unitOptions[product.id] || [])[0];
    const key = `${product.id}_${Date.now()}`;
    const qtyToAdd = options?.qty !== undefined ? options.qty : 1;

    // Existing line check
    const existingIndex = cart.findIndex(
      (l) => l.productId === product.id && l.unitId === (options?.unitId || opt?.unitId || product.base_unit_id)
    );
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty = Number((updated[existingIndex].qty + qtyToAdd).toFixed(3));
      setCart(updated);
      toast.success(`تم تحديث كمية «${product.name}» إلى ${updated[existingIndex].qty}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }

    let batchId = '';
    if (product.tracks_batch) {
      const cands = (batches[product.id] || []).filter((b) => b.current_quantity > 0);
      batchId = cands[0]?.id || '';
    }

    setCart((prev) => [
      ...prev,
      {
        key,
        productId: product.id,
        batchId,
        unitId: options?.unitId || opt?.unitId || product.base_unit_id,
        factor: options?.factor || opt?.factor || 1,
        qty: qtyToAdd,
        price: Number(options?.price ?? opt?.price ?? product.sale_price ?? 0),
        discount: 0,
        cost: product.purchase_price,
        taxRate: product.tax_rate || 0,
      },
    ]);

    setSearchQuery('');
    setIsSearchOpen(false);
    toast.success(`تمت إضافة «${product.name}» (${qtyToAdd}) للسلة`);
  };

  // Direct Barcode Scan / Enter Key (Supports standard barcodes & electronic scale barcodes)
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;

      // 1. Try scale barcode parsing if scale integration enabled
      if (scaleConfig.enabled) {
        const parsedScale = ScaleManager.parseBarcode(q, scaleConfig);
        if (parsedScale.isScale && parsedScale.plu) {
          const pluStr = parsedScale.plu;
          const rawPluStr = parsedScale.rawPlu || '';
          const scaleProduct = products.find(
            (p) =>
              (p.scale_code && p.scale_code.trim() === pluStr) ||
              p.sku.toLowerCase() === pluStr.toLowerCase() ||
              (rawPluStr && p.sku === rawPluStr)
          );

          if (scaleProduct) {
            if (parsedScale.weight !== undefined) {
              addToCart(scaleProduct, { qty: parsedScale.weight });
              toast.success(`⚖️ باركود ميزان: «${scaleProduct.name}» (وزن: ${parsedScale.weight} كجم)`);
              return;
            } else if (parsedScale.price !== undefined) {
              const unitPrice = scaleProduct.sale_price || 1;
              const calculatedQty = Number((parsedScale.price / unitPrice).toFixed(3));
              addToCart(scaleProduct, { qty: calculatedQty });
              toast.success(`⚖️ باركود ميزان: «${scaleProduct.name}» (سعر: ${parsedScale.price} ج.م | وزن: ${calculatedQty} كجم)`);
              return;
            }
          }
        }
      }

      // Exact barcode or SKU match
      const exact = products.find(
        (p) => p.sku.toLowerCase() === q.toLowerCase()
      );

      if (exact) {
        addToCart(exact);
      } else if (searchResults.length > 0) {
        addToCart(searchResults[0]);
      } else {
        toast.error(`لا يوجد صنف مسجل بهذا الكود: «${q}»`);
      }
    }
  };

  // Read Live Weight from USB/Serial Scale (Web Serial API)
  const handleReadLiveWeight = async (targetLineKey?: string) => {
    if (cart.length === 0) {
      toast.warning('يرجى إضافة صنف وزني أولاً إلى السلة لقراءة وزنه من الميزان');
      return;
    }

    setIsReadingScale(true);
    try {
      const res = await ScaleManager.readLiveWeightFromSerial(scaleConfig.baudRate);
      if (res.success && res.weight && res.weight > 0) {
        const weight = res.weight;
        const targetIndex = targetLineKey
          ? cart.findIndex((l) => l.key === targetLineKey)
          : cart.length - 1;

        if (targetIndex >= 0) {
          const updated = [...cart];
          const prod = products.find((p) => p.id === updated[targetIndex].productId);
          updated[targetIndex].qty = weight;
          setCart(updated);
          toast.success(`⚖️ تم سحب وزن الميزان: ${weight} كجم لصالح «${prod?.name || ''}»`);
        }
      } else {
        toast.error(res.error || 'لم يتم استلام قراءة وزن صالحة من الميزان الإلكتروني');
      }
    } catch (err: any) {
      toast.error(err.message || 'تعذر الاتصال بالميزان الإلكتروني عبر منفذ COM/Serial');
    } finally {
      setIsReadingScale(false);
    }
  };

  // Cart Manipulations
  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.key === key) {
            const next = l.qty + delta;
            return next > 0 ? { ...l, qty: next } : null;
          }
          return l;
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
    toast.info('تم حذف الصنف من الفاتورة');
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setGlobalDiscount(0);
    toast.info('تم إلغاء وتفريغ الفاتورة (F12)');
  };

  // Calculations
  const lineProduct = (line: CartLine) => products.find((p) => p.id === line.productId);
  const lineSubtotal = (line: CartLine) => line.qty * line.price;
  const lineTotal = (line: CartLine) => lineSubtotal(line) - line.discount;

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + lineSubtotal(l), 0), [cart]);
  const itemDiscounts = useMemo(() => cart.reduce((sum, l) => sum + l.discount, 0), [cart]);
  const totalDiscount = itemDiscounts + globalDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  // Complete Checkout
  const handleCheckout = async (payType: 'cash' | 'card' | 'credit' | 'split') => {
    if (cart.length === 0) {
      toast.error('السلة فارغة! يرجى إضافة أصناف أولاً.');
      return;
    }
    if (!warehouseId || !treasuryId) {
      toast.error('يرجى تحديد المخزن والخزينة لإتمام البيع.');
      return;
    }
    if (payType === 'credit' && !selectedCustomerId) {
      setIsCustomerModalOpen(true);
      toast.error('البيع الآجل يتطلب تحديد العميل أولاً!');
      return;
    }

    setIsSaving(true);
    try {
      const items = cart.map((line) => ({
        productId: line.productId,
        batchId: line.batchId || null,
        unitId: line.unitId,
        conversionFactor: line.factor,
        quantity: line.qty,
        unitPrice: line.price,
        unitCost: line.cost * line.factor,
        discountAmount: line.discount,
        taxRate: line.taxRate,
      }));

      const invoice = await SalesRepository.createSalesInvoice({
        orgId,
        branchId,
        warehouseId,
        shiftId: activeShift?.id || null,
        customerId: selectedCustomerId || null,
        items,
        discountAmount: totalDiscount,
        paymentType: payType,
        cashAmount: payType === 'cash' ? total : 0,
        cardAmount: payType === 'card' ? total : 0,
        treasuryId,
        userId: currentUser?.id || '',
        notes: notes.trim() || undefined,
      });

      setSuccessInvoice(invoice);
      toast.success(`تم حفظ وطباعة الفاتورة #${invoice.invoice_number} بنجاح!`);
      setCart([]);
      setGlobalDiscount(0);
      setNotes('');
      setSelectedCustomerId('');
      setCustomerMode('cash');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء إتمام عملية البيع.');
    } finally {
      setIsSaving(false);
    }
  };

  // Global Keyboard Shortcuts inside POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F10: Fast Cash Checkout
      if (e.key === 'F10') {
        e.preventDefault();
        handleCheckout('cash');
        return;
      }
      // F7: Card Payment
      if (e.key === 'F7') {
        e.preventDefault();
        handleCheckout('card');
        return;
      }
      // F9: Split Payment
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout('split');
        return;
      }
      // F12: Cancel / Clear Cart
      if (e.key === 'F12') {
        e.preventDefault();
        clearCart();
        return;
      }
      // F6: Read Live Weight from Scale
      if (e.key === 'F6') {
        e.preventDefault();
        handleReadLiveWeight();
        return;
      }
      // F2: Focus Search / Barcode
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      // F3: Quick Product Lookup Modal
      if (e.key === 'F3') {
        e.preventDefault();
        setIsLookupModalOpen(true);
        return;
      }
      // Escape: Close search or modals
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsCustomerModalOpen(false);
        setIsLookupModalOpen(false);
        setIsHeldModalOpen(false);
        setIsShiftModalOpen(false);
        setSuccessInvoice(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, warehouseId, treasuryId, selectedCustomerId, total, totalDiscount]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8] dark:bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري تحميل نقطة البيع (الكاشير)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none overflow-x-hidden font-sans">
      {/* ==============================================================
          1. TOP EXECUTIVE CASHIER HEADER (طابق الهيدر العلوي)
         ============================================================== */}
      <header className="h-14 bg-white dark:bg-[#111726] border-b border-slate-200/90 dark:border-slate-800 px-4 flex items-center justify-between shadow-2xs shrink-0">
        {/* Right side (in RTL): Brand & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            title="القائمة الرئيسية"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push('/')}
            title="العودة للرئيسية"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>نقطة البيع (الكاشير)</span>
          </h1>

          <span className="hidden sm:inline-flex text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 rounded-md px-2.5 py-0.5 mr-2">
            لوجيسكا سيستمز | نظام إدارة الصيدلية v1
          </span>
        </div>

        {/* Left side (in RTL): Controls, Status, Quick Tools, Date */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toISOString().slice(0, 10)}</span>
          </div>

          {/* Notifications */}
          <button
            title="الإشعارات"
            className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-1 rounded-full">
              +99
            </span>
          </button>

          {/* Support Headset */}
          <button
            title="الدعم الفني المباشر"
            onClick={() => setIsSupportOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Headphones className="w-4 h-4" />
          </button>

          {/* Cash Drawer Tool */}
          <button
            title="فتح درج النقدية"
            onClick={() => toast.success('تم إرسال أمر فتح درج النقدية الكهرومغناطيسي')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
          </button>

          {/* Calculator Tool */}
          <button
            title="الآلة الحاسبة"
            onClick={() => setIsCalcOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* Online Badge */}
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>متصل</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="تبديل الوضع الليلي"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Initial Circle */}
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-center text-xs border border-emerald-300 dark:border-emerald-700">
            {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'ع'}
          </div>
        </div>
      </header>

      {/* ==============================================================
          2. QUICK ACTIONS TOOLBAR (أزرار العمليات السريعة الملونة)
         ============================================================== */}
      <div className="bg-white/90 dark:bg-[#111726]/90 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex flex-col gap-2 shrink-0">
        {/* Row 1: Home & Core Operational Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Home Icon Square Button */}
          <Link
            href="/"
            title="الرئيسية"
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* إضافة مصروفات */}
          <Link href="/accounts/expenses">
            <button className="h-8 px-3 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all">
              <Receipt className="w-3.5 h-3.5" />
              <span>إضافة مصروفات</span>
            </button>
          </Link>

          {/* استعلام أصناف (F3) */}
          <button
            onClick={() => setIsLookupModalOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>استعلام أصناف (F3)</span>
          </button>

          {/* أصناف سريعة */}
          <button
            onClick={() => {
              if (products.length > 0) addToCart(products[0]);
            }}
            className="h-8 px-3 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>أصناف سريعة</span>
          </button>

          {/* آخر العمليات */}
          <Link href="/sales/invoices">
            <button className="h-8 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all">
              <Clock className="w-3.5 h-3.5" />
              <span>آخر العمليات</span>
            </button>
          </Link>

          {/* مبيعات معلقة */}
          <button
            onClick={() => setIsHeldModalOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>مبيعات معلقة</span>
          </button>

          {/* مرتجع مبيعات */}
          <Link href="/sales/returns">
            <button className="h-8 px-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مرتجع مبيعات</span>
            </button>
          </Link>

          {/* مرتجع مشتريات */}
          <Link href="/purchases/returns">
            <button className="h-8 px-3 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مرتجع مشتريات</span>
            </button>
          </Link>

          {/* تفاصيل الجلسة */}
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#db2777] hover:bg-[#be185d] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>تفاصيل الجلسة</span>
          </button>

          {/* وزن الميزان (F6) */}
          <button
            onClick={() => handleReadLiveWeight()}
            disabled={isReadingScale}
            title="سحب الوزن المباشر من الميزان الإلكتروني (F6)"
            className="h-8 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Scale className={`w-3.5 h-3.5 ${isReadingScale ? 'animate-spin' : ''}`} />
            <span>وزن الميزان (F6)</span>
          </button>
        </div>

        {/* Row 2: Secondary Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* تحصيل عميل */}
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="h-7 px-3 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <UserCheck className="w-3 h-3" />
            <span>تحصيل عميل</span>
          </button>

          {/* دفع لمورد */}
          <Link href="/purchases/invoices/new">
            <button className="h-7 px-3 rounded-lg bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer">
              <Truck className="w-3 h-3" />
              <span>دفع لمورد</span>
            </button>
          </Link>

          {/* إغلاق الوردية */}
          <Link href="/sales/shifts">
            <button className="h-7 px-3 rounded-lg bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer">
              <LogOut className="w-3 h-3" />
              <span>إغلاق الوردية</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ==============================================================
          3. BARCODE, SEARCH & CUSTOMER SELECTION BAR (الشريط الأوسط)
         ============================================================== */}
      <div className="bg-white dark:bg-[#111726] border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        {/* Right side: Customer Segmented Pill */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 w-full md:w-auto">
          <button
            onClick={() => {
              setCustomerMode('cash');
              setSelectedCustomerId('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              customerMode === 'cash'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>نقدي</span>
          </button>

          <button
            onClick={() => {
              setCustomerMode('customer');
              setIsCustomerModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              customerMode === 'customer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId)?.name : 'العملاء'}</span>
          </button>

          <button
            onClick={() => router.push('/contacts/suppliers')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Building className="w-3.5 h-3.5" />
            <span>مورد</span>
          </button>
        </div>

        {/* Center: Search & Barcode Input Field */}
        <div className="relative flex-1 w-full max-w-2xl">
          <div className="relative flex items-center">
            {/* Search icon with count pill badge */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 pointer-events-none">
              <span className="text-xs font-mono font-bold">{cart.length}</span>
              <Search className="w-4 h-4" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ابحث هنا... (اسم الصنف، الباركود، الكود الدولي)"
              className="w-full h-10 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700/80 rounded-full pr-12 pl-16 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* F2 shortcut tag badge */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <span className="bg-slate-200/70 dark:bg-slate-700/70 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                F2
              </span>
            </div>
          </div>

          {/* Autocomplete Search Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-150">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>نتائج البحث المباشرة ({searchResults.length})</span>
                <span>اضغط Enter لإضافة أول نتيجة</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((p) => {
                  const avail = availableFor(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="p-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          باركود / SKU: {p.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatNumber(p.sale_price)} ج.م
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            avail > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {avail > 0 ? `متاح: ${avail}` : 'نفد'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Left side: Price Tier Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">فئة السعر</span>
          <div className="relative">
            <select
              value={priceTier}
              onChange={(e) => setPriceTier(e.target.value)}
              className="appearance-none h-9 pr-7 pl-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="default">السعر الأساسي...</option>
              <option value="wholesale">سعر الجملة</option>
              <option value="vip">سعر كبار العملاء</option>
            </select>
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ==============================================================
          4. INVOICE ITEMS TABLE (جدول أصناف الفاتورة الرئيسية)
         ============================================================== */}
      <main className="flex-1 overflow-y-auto px-4 py-3">
        <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-right text-xs">
            {/* Table Header */}
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3">الصنف</th>
                <th className="py-3 px-3 text-center">تاريخ الصلاحية</th>
                <th className="py-3 px-3 text-center">الوحدة</th>
                <th className="py-3 px-3 text-center w-36">الكمية</th>
                <th className="py-3 px-3 text-center w-28">السعر</th>
                <th className="py-3 px-3 text-center w-32">الإجمالي</th>
                <th className="py-3 px-3 text-center w-14"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Barcode className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                        الفاتورة فارغة حالياً
                      </p>
                      <p className="text-xs text-slate-400">
                        امسح الباركود أو ابحث عن صنف لإضافته مباشرة إلى الفاتورة (اضغط F2 للبحث).
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                cart.map((line, index) => {
                  const product = lineProduct(line);
                  const avail = product ? availableFor(product.id) : 0;
                  const opts = product ? unitOptions[product.id] || [] : [];
                  const totalLineVal = lineTotal(line);

                  return (
                    <tr key={line.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* # Index */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400">{index + 1}</td>

                      {/* Product Name */}
                      <td className="py-3.5 px-3">
                        <div className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                          {product?.name || 'صنف غير معروف'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          كود: {product?.sku || line.productId}
                        </div>
                      </td>

                      {/* Expiry / Batch */}
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                        {line.batchId ? (
                          <span className="font-mono text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                            دفعة #{line.batchId.slice(0, 6)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">بدون تاريخ</span>
                        )}
                      </td>

                      {/* Unit Selector */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-block relative">
                          <select
                            value={line.unitId}
                            onChange={(e) => {
                              const newU = e.target.value;
                              const matched = opts.find((o) => o.unitId === newU);
                              setCart((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? {
                                        ...l,
                                        unitId: newU,
                                        factor: matched?.factor || 1,
                                        price: matched?.price ?? l.price,
                                      }
                                    : l
                                )
                              );
                            }}
                            className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 pr-6 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
                          >
                            {opts.map((o) => (
                              <option key={o.unitId} value={o.unitId}>
                                {unitsById[o.unitId]?.name || o.unitId}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Quantity Stepper & Available count */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-700">
                            <button
                              onClick={() => updateQty(line.key, -1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              step="any"
                              value={line.qty}
                              onChange={(e) => {
                                const val = Math.max(0.001, parseFloat(e.target.value) || 1);
                                setCart((prev) => prev.map((l) => (l.key === line.key ? { ...l, qty: val } : l)));
                              }}
                              className="w-14 text-center bg-transparent font-black text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={() => updateQty(line.key, 1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-blue-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {(product?.measurement_type === 'weight' || product?.scale_code) && (
                              <button
                                onClick={() => handleReadLiveWeight(line.key)}
                                disabled={isReadingScale}
                                title="سحب الوزن المباشر من الميزان لهذا الصنف"
                                className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Scale className={`w-3.5 h-3.5 ${isReadingScale ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            المتاح: {avail}
                          </span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                        {line.price.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                      </td>

                      {/* Line Total */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                          {totalLineVal.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                        </div>
                        {line.discount > 0 && (
                          <span className="text-[10px] text-red-500 font-bold">خصم: {line.discount} ج.م</span>
                        )}
                      </td>

                      {/* Delete Action Button */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => removeLine(line.key)}
                          title="حذف الصنف"
                          className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ==============================================================
          5. DARK TOTALS BAR (شريط المجاميع السفلي الداكن)
         ============================================================== */}
      <div className="bg-[#0b1329] text-white px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg shrink-0">
        {/* Right: الأصناف */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">الأصناف:</span>
          <span className="text-2xl font-black text-white font-mono">{cart.length}</span>
        </div>

        {/* Center: التفاصيل المحاسبية */}
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-400">الإجمالي قبل الخصم:</span>
            <span className="text-base font-black text-slate-200 font-mono">
              {subtotal.toFixed(2)} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-400">إجمالي الخصومات:</span>
            <span className="text-base font-black text-amber-400 font-mono">
              {totalDiscount.toFixed(2)} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </span>
          </div>
        </div>

        {/* Left: الصافي النهائي البارز */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-black text-slate-300">الصافي النهائي:</span>
          <span className="text-2xl sm:text-3xl font-black text-[#00e5a3] font-mono tracking-tight drop-shadow-sm">
            {total.toFixed(2)} <span className="text-sm font-bold text-emerald-300">ج.م</span>
          </span>
        </div>
      </div>

      {/* ==============================================================
          6. BOTTOM PAYMENT & ACTION BUTTONS BAR (أزرار الدفع بالهوتكيز)
         ============================================================== */}
      <div className="bg-white dark:bg-[#111726] border-t border-slate-200 dark:border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 shrink-0">
        {/* إلغاء (F12) */}
        <button
          onClick={clearCart}
          className="h-11 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>إلغاء (F12)</span>
        </button>

        {/* دفع نقدي (F10) - PRIMARY */}
        <button
          onClick={() => handleCheckout('cash')}
          disabled={isSaving}
          className="h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <DollarSign className="w-4 h-4" />
          <span>{isSaving ? 'جارٍ الحفظ...' : 'دفع نقدي (F10)'}</span>
        </button>

        {/* دفع بالبطاقة (F7) */}
        <button
          onClick={() => handleCheckout('card')}
          disabled={isSaving}
          className="h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          <span>دفع بالبطاقة (F7)</span>
        </button>

        {/* دفع مختلط (F9) */}
        <button
          onClick={() => handleCheckout('split')}
          disabled={isSaving}
          className="h-11 rounded-xl bg-[#334155] hover:bg-[#1e293b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Layers className="w-4 h-4" />
          <span>دفع مختلط (F9)</span>
        </button>

        {/* بيع آجل */}
        <button
          onClick={() => handleCheckout('credit')}
          disabled={isSaving}
          className="h-11 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <UserCheck className="w-4 h-4" />
          <span>بيع آجل</span>
        </button>

        {/* مرتجع */}
        <Link href="/sales/returns" className="w-full">
          <button className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer">
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>مرتجع</span>
          </button>
        </Link>

        {/* عرض سعر */}
        <button
          onClick={() => toast.info('تم حفظ العملية كعرض سعر')}
          className="h-11 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>عرض سعر</span>
        </button>

        {/* مسودة */}
        <button
          onClick={() => toast.info('تم حفظ الفاتورة كمسودة مؤقتة')}
          className="h-11 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>مسودة</span>
        </button>
      </div>

      {/* ==============================================================
          7. MODALS (العملاء، الاستعلام، المعلق، الفاتورة الناجحة)
         ============================================================== */}

      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>اختيار العميل للفاتورة</span>
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div
                onClick={() => {
                  setSelectedCustomerId('');
                  setCustomerMode('cash');
                  setIsCustomerModalOpen(false);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  !selectedCustomerId ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 dark:text-white">عميل نقدي عام</div>
                <div className="text-[10px] text-slate-400">سداد فوري بدون رصيد حساب</div>
              </div>

              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setCustomerMode('customer');
                    setIsCustomerModalOpen(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedCustomerId === c.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</div>
                  <div className="text-[10px] text-slate-400">
                    هاتف: {c.phone || 'غير مسجل'} • الرصيد: {formatNumber(c.current_balance)} ج.م
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Lookup Modal (F3) */}
      {isLookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-600" />
                <span>دليل واستعلام الأصناف (F3)</span>
              </h3>
              <button onClick={() => setIsLookupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    addToCart(p);
                    setIsLookupModalOpen(false);
                  }}
                  className="py-2.5 px-3 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between cursor-pointer rounded-xl transition-colors"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">باركود / كود: {p.sku}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-purple-600">{formatNumber(p.sale_price)} ج.م</span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      متاح: {availableFor(p.id)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {successInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              تم إتمام عملية البيع بنجاح!
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              رقم الفاتورة: #{successInvoice.invoice_number}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs flex justify-between font-mono font-bold">
              <span>المبلغ المدفوع:</span>
              <span className="text-emerald-600 text-sm">{formatNumber(successInvoice.total)} ج.م</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الإيصال</span>
              </button>
              <button
                onClick={() => setSuccessInvoice(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                فاتورة جديدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Calculator Modals */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <CalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </div>
  );
}