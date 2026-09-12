'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from '@/modules/inventory/product_repository';
import type {
  Product,
  ProductCategory,
  ProductBrand,
  ProductTypeItem,
  ProductUnit,
  Unit,
  Warehouse,
  ProductBatch,
} from '@/types';
import {
  Package,
  Scale,
  Plus,
  Trash2,
  TrendingUp,
  Check,
  Barcode,
  SquarePen,
  X,
  SlidersHorizontal,
  Settings,
  Clock,
  ImagePlus,
  Wand2,
  MapPin,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Info,
  Calendar,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ProductFormProps {
  orgId: string;
  categories: ProductCategory[];
  brands: ProductBrand[];
  productTypes?: ProductTypeItem[];
  units: Unit[];
  warehouses?: Warehouse[];
  initial?: Product;
  initialUnits?: ProductUnit[];
  onSaved: () => void;
  onCancel: () => void;
}

interface UnitLevelItem {
  id: string;
  unitName: string;
  conversionFactor: string;
  openingStock: string;
  allowSale: boolean;
  purchasePrice: string;
  discountValue: string;
  discountType: 'percent' | 'amount';
  dualPricing: boolean;
  salePrice: string;
  oldSalePrice: string;
  newSalePrice: string;
}

interface FormBatchEntry {
  id: string;
  quantity: string;
  unitLevelId: string; // 'level-1' | 'level-2' | 'level-3' | 'weight'
  day: string;
  month: string;
  year: string;
  batchNumber: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  orgId,
  categories,
  brands,
  productTypes = [],
  units,
  warehouses = [],
  initial,
  initialUnits = [],
  onSaved,
  onCancel,
}) => {
  const isEdit = !!initial;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 1. شريط التخصيص العلوي: الديفولت الافتراضي false بناءً على طلب صاحب المنشأة
  // =========================================================================
  const [showSpecs, setShowSpecs] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);

  // =========================================================================
  // 2. الربط المباشر مع بيانات المؤسسة المدخلة من صاحب العمل فقط
  // =========================================================================
  const [localBrands, setLocalBrands] = useState<ProductBrand[]>(brands);
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(categories);
  const [localProductTypes, setLocalProductTypes] = useState<ProductTypeItem[]>(productTypes);

  useEffect(() => {
    setLocalBrands(brands);
  }, [brands]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (productTypes && productTypes.length > 0) {
      setLocalProductTypes(productTypes);
    }
  }, [productTypes]);

  // منع تكرار الأسماء في القوائم
  const uniqueProductTypes = React.useMemo(() => {
    const map = new Map<string, ProductTypeItem>();
    for (const item of localProductTypes) {
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [localProductTypes]);

  const uniqueBrands = React.useMemo(() => {
    const map = new Map<string, ProductBrand>();
    for (const item of localBrands) {
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [localBrands]);

  const uniqueCategories = React.useMemo(() => {
    const map = new Map<string, ProductCategory>();
    for (const item of localCategories) {
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [localCategories]);

  // =========================================================================
  // 3. بيانات الصنف الأساسية (خالية من أي بيانات صيدلانية أو افتراضات ثابتة)
  // =========================================================================
  const [itemTypeMode, setItemTypeMode] = useState<'unit' | 'weight'>(
    initial?.measurement_type || 'unit'
  );
  const [name, setName] = useState(initial?.name || '');
  const [nameEn, setNameEn] = useState(initial?.name_en || '');
  const [scientificName, setScientificName] = useState(initial?.scientific_name || '');
  const [sku, setSku] = useState(initial?.sku || '');
  const [alternateBarcodes, setAlternateBarcodes] = useState<string[]>(
    initial?.alternate_barcodes || []
  );
  const [shelfLocation, setShelfLocation] = useState(initial?.shelf_location || '');
  const [imageUrl, setImageUrl] = useState<string>(initial?.image_url || '');

  // التصنيفات
  const [categoryId, setCategoryId] = useState(initial?.category_id || 'none');
  const [brandId, setBrandId] = useState(initial?.brand_id || 'none');
  const [productType, setProductType] = useState<string>(initial?.product_type || 'none');

  // الإعدادات المتقدمة
  const [isTaxable, setIsTaxable] = useState(initial?.is_taxable || false);
  const [enableMinStockAlert, setEnableMinStockAlert] = useState(
    (initial?.min_stock_alert ?? 0) > 0
  );
  const [minStockAlert, setMinStockAlert] = useState(
    initial?.min_stock_alert ? String(initial.min_stock_alert) : '5'
  );
  const [isActiveForSale, setIsActiveForSale] = useState(initial?.is_active ?? true);
  const [isQuickPos, setIsQuickPos] = useState(initial?.is_quick_pos || false);
  const [productNotes, setProductNotes] = useState(initial?.notes || '');

  // تتبع الصلاحية والتشغيلات (الديفولت false بناءً على رغبة المستخدم)
  const [enableExpiryTracking, setEnableExpiryTracking] = useState(
    initial?.tracks_expiry ?? false
  );
  const [batchEntries, setBatchEntries] = useState<FormBatchEntry[]>([]);

  // تحميل تشغيلات الصلاحية السابقة إن وجدت في وضع التعديل
  useEffect(() => {
    if (initial?.id) {
      ProductRepository.getProductBatches(initial.id)
        .then((batches: ProductBatch[]) => {
          if (batches && batches.length > 0) {
            const mapped: FormBatchEntry[] = batches.map((b) => {
              let day = '';
              let month = '';
              let year = '';
              if (b.expiry_date) {
                const parts = b.expiry_date.split('-');
                if (parts.length === 3) {
                  year = parts[0];
                  month = parts[1];
                  day = parts[2];
                }
              }
              return {
                id: b.id,
                quantity: String(b.current_quantity ?? b.initial_quantity ?? 1),
                unitLevelId: itemTypeMode === 'unit' ? 'level-1' : 'weight',
                day,
                month,
                year,
                batchNumber: b.batch_number || '',
              };
            });
            setBatchEntries(mapped);
            setShowExpiry(true);
            setEnableExpiryTracking(true);
          }
        })
        .catch(console.error);
    }
  }, [initial?.id, itemTypeMode]);

  // حالة النافذة المنبثقة (Modal Dialog) للإضافة والإدارة
  type ModalType = 'brand' | 'category' | 'product_type' | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [isModalSaving, setIsModalSaving] = useState(false);

  const handleModalSave = async () => {
    if (!modalInputValue.trim()) return;
    const val = modalInputValue.trim();
    setIsModalSaving(true);
    try {
      if (activeModal === 'brand') {
        const created = await ProductRepository.createBrand(val, orgId);
        setLocalBrands((prev) => [...prev, created]);
        setBrandId(created.id);
        toast.success('تمت إضافة الشركة / الماركة بنجاح');
      } else if (activeModal === 'category') {
        const created = await ProductRepository.createCategory(val, orgId);
        setLocalCategories((prev) => [...prev, created]);
        setCategoryId(created.id);
        toast.success('تمت إضافة المجموعة / التصنيف بنجاح');
      } else if (activeModal === 'product_type') {
        const created = await ProductRepository.createProductType(val, orgId);
        setLocalProductTypes((prev) => [...prev, created]);
        setProductType(created.name);
        toast.success('تمت إضافة نوع المنتج بنجاح');
      }
      setModalInputValue('');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsModalSaving(false);
    }
  };

  // حذف عنصر تصنيف / نوع / ماركة غير مرغوب فيه
  const handleDeleteLookupItem = async (type: 'brand' | 'category' | 'product_type', id: string, name: string) => {
    try {
      if (type === 'brand') {
        await ProductRepository.deleteBrand(id);
        setLocalBrands((prev) => prev.filter((x) => x.id !== id));
        if (brandId === id) setBrandId('none');
        toast.info(`تم حذف "${name}"`);
      } else if (type === 'category') {
        await ProductRepository.deleteCategory(id);
        setLocalCategories((prev) => prev.filter((x) => x.id !== id));
        if (categoryId === id) setCategoryId('none');
        toast.info(`تم حذف "${name}"`);
      } else if (type === 'product_type') {
        await ProductRepository.deleteProductType(id);
        setLocalProductTypes((prev) => prev.filter((x) => x.id !== id));
        if (productType === name) setProductType('none');
        toast.info(`تم حذف "${name}"`);
      }
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف العنصر');
    }
  };

  // =========================================================================
  // 4. حالة وحدات القطع (تترك فارغة ليكتب صاحب المنشأة مسمياته بنفسه)
  // =========================================================================
  const [unitLevels, setUnitLevels] = useState<UnitLevelItem[]>(() => {
    if (initialUnits.length > 0) {
      return [
        {
          id: 'level-1',
          unitName: units.find((u) => u.id === initial?.base_unit_id)?.name || '',
          conversionFactor: '1',
          openingStock: '',
          allowSale: true,
          purchasePrice: initial?.purchase_price ? String(initial.purchase_price) : '',
          discountValue: '',
          discountType: 'percent',
          dualPricing: initial?.has_dual_pricing ?? !!initial?.old_sale_price,
          salePrice: initial?.sale_price ? String(initial.sale_price) : '',
          oldSalePrice: initial?.old_sale_price ? String(initial.old_sale_price) : '',
          newSalePrice: initial?.sale_price ? String(initial.sale_price) : '',
        },
        ...initialUnits.slice(0, 2).map((u, idx) => ({
          id: `level-${idx + 2}`,
          unitName: units.find((un) => un.id === u.unit_id)?.name || '',
          conversionFactor: String(u.conversion_factor || 1),
          openingStock: '',
          allowSale: u.is_default_sale ?? true,
          purchasePrice: u.purchase_price ? String(u.purchase_price) : '',
          discountValue: '',
          discountType: 'percent' as const,
          dualPricing: u.has_dual_pricing ?? !!u.old_sale_price,
          salePrice: u.sale_price ? String(u.sale_price) : '',
          oldSalePrice: u.old_sale_price ? String(u.old_sale_price) : '',
          newSalePrice: u.sale_price ? String(u.sale_price) : '',
        })),
      ];
    }
    return [
      {
        id: 'level-1',
        unitName: '', // فارغ ليدخله المستخدم
        conversionFactor: '1',
        openingStock: '',
        allowSale: true,
        purchasePrice: '',
        discountValue: '',
        discountType: 'percent',
        dualPricing: false,
        salePrice: '',
        oldSalePrice: '',
        newSalePrice: '',
      },
    ];
  });

  // حالة الوزن (كيلو / ميزان إلكتروني لأي مجال: سوبرماركت، عطارة، لحوم، إلخ)
  const [weightUnitName] = useState('كيلوجرام (كجم)');
  const [scaleCode, setScaleCode] = useState(initial?.scale_code || '');
  const [weightOpeningStock, setWeightOpeningStock] = useState('');
  const [weightPurchasePrice, setWeightPurchasePrice] = useState('');
  const [weightDiscount, setWeightDiscount] = useState('');
  const [weightDiscountType, setWeightDiscountType] = useState<'percent' | 'amount'>('percent');
  const [weightSalePrice, setWeightSalePrice] = useState('');
  const [weightOldSalePrice, setWeightOldSalePrice] = useState('');
  const [weightNewSalePrice, setWeightNewSalePrice] = useState('');
  const [weightDualPricing, setWeightDualPricing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // حساب هامش الربح تلقائياً
  const calculateMargin = (costStr: string, saleStr: string) => {
    const cost = parseFloat(costStr);
    const sale = parseFloat(saleStr);
    if (!cost || cost <= 0 || !sale) return '0.0%';
    const margin = ((sale - cost) / cost) * 100;
    return `${margin.toFixed(1)}%`;
  };

  // إضافة مستوى وحدة أصغر (بحد أقصى 3 مستويات)
  const handleAddSmallerUnit = () => {
    if (unitLevels.length >= 3) {
      toast.warning('الحد الأقصى للوحدات هو 3 مستويات فقط.');
      return;
    }

    if (!unitLevels[0]?.unitName.trim()) {
      toast.error('يرجى تحديد اسم الوحدة الأساسية أولاً قبل إضافة وحدات أصغر.');
      return;
    }

    const nextNumber = unitLevels.length + 1;
    const newLevel: UnitLevelItem = {
      id: `level-${Date.now()}`,
      unitName: '',
      conversionFactor: '1',
      openingStock: '',
      allowSale: true,
      purchasePrice: '',
      discountValue: '',
      discountType: 'percent',
      dualPricing: false,
      salePrice: '',
      oldSalePrice: '',
      newSalePrice: '',
    };

    setUnitLevels((prev) => [...prev, newLevel]);
    toast.success(`تمت إضافة المستوى رقم (${nextNumber})`);
  };

  const updateUnitLevel = (idx: number, patch: Partial<UnitLevelItem>) => {
    setUnitLevels((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const removeUnitLevel = (idx: number) => {
    if (idx === 0) {
      toast.error('لا يمكن حذف الوحدة الأساسية الأولى.');
      return;
    }
    setUnitLevels((prev) => prev.filter((_, i) => i !== idx));
    toast.info('تم حذف المستوى.');
  };

  // توليد باركود تلقائي رقمي نظيف (12 رقم قياسي)
  const handleGenerateRandomBarcode = () => {
    const rand = '628' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setSku(rand);
    toast.success('تم توليد باركود تلقائي بنجاح');
  };

  // إدارة الباركود البديل
  const handleAddAlternateBarcode = () => {
    setAlternateBarcodes((prev) => [...prev, '']);
  };

  const handleUpdateAlternateBarcode = (idx: number, val: string) => {
    setAlternateBarcodes((prev) => prev.map((b, i) => (i === idx ? val : b)));
  };

  const handleRemoveAlternateBarcode = (idx: number) => {
    setAlternateBarcodes((prev) => prev.filter((_, i) => i !== idx));
  };

  // تحميل صورة الصنف
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب ألا يتجاوز 2 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
      toast.success('تم تحميل صورة الصنف بنجاح');
    };
    reader.readAsDataURL(file);
  };

  // إضافة صف تاريخ صلاحية جديد
  const handleAddBatch = () => {
    const today = new Date();
    const nextYear = today.getFullYear() + 1;
    const newBatch: FormBatchEntry = {
      id: uuidv4(),
      quantity: '1',
      unitLevelId: itemTypeMode === 'unit' ? 'level-1' : 'weight',
      day: String(today.getDate()).padStart(2, '0'),
      month: String(today.getMonth() + 1).padStart(2, '0'),
      year: String(nextYear),
      batchNumber: '',
    };
    setBatchEntries((prev) => [...prev, newBatch]);
  };

  const handleUpdateBatch = (idx: number, patch: Partial<FormBatchEntry>) => {
    setBatchEntries((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleRemoveBatch = (idx: number) => {
    setBatchEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  // تفريغ البيانات بالكامل
  const handleResetForm = () => {
    setName('');
    setNameEn('');
    setScientificName('');
    setSku('');
    setAlternateBarcodes([]);
    setShelfLocation('');
    setImageUrl('');
    setScaleCode('');
    setCategoryId('none');
    setBrandId('none');
    setProductType('none');
    setIsTaxable(false);
    setEnableMinStockAlert(false);
    setMinStockAlert('5');
    setIsActiveForSale(true);
    setIsQuickPos(false);
    setProductNotes('');
    setShowSpecs(false);
    setShowAdvanced(false);
    setShowExpiry(false);
    setEnableExpiryTracking(false);
    setBatchEntries([]);
    setUnitLevels([
      {
        id: 'level-1',
        unitName: '',
        conversionFactor: '1',
        openingStock: '',
        allowSale: true,
        purchasePrice: '',
        discountValue: '',
        discountType: 'percent',
        dualPricing: false,
        salePrice: '',
        oldSalePrice: '',
        newSalePrice: '',
      },
    ]);
    setWeightOpeningStock('');
    setWeightPurchasePrice('');
    setWeightDiscount('');
    setWeightSalePrice('');
    setWeightOldSalePrice('');
    setWeightNewSalePrice('');
    setWeightDualPricing(false);
    toast.info('تم تفريغ كافة حقول البيانات.');
  };

  // حفظ الصنف
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الصنف.');
      return;
    }

    setIsSaving(true);
    try {
      // إيجاد أو إنشاء الوحدة الأساسية
      let baseU = units.find((u) =>
        itemTypeMode === 'weight'
          ? u.name.includes('كيلو') || u.symbol.toLowerCase() === 'kg'
          : u.name === unitLevels[0].unitName
      );

      if (!baseU) {
        const uName = itemTypeMode === 'weight' ? 'كيلوجرام' : unitLevels[0].unitName || 'قطعة';
        baseU = await ProductRepository.createUnit(uName, uName.slice(0, 3), orgId);
      }

      const pPrice =
        itemTypeMode === 'weight'
          ? parseFloat(weightPurchasePrice) || 0
          : parseFloat(unitLevels[0].purchasePrice) || 0;

      const sPrice =
        itemTypeMode === 'weight'
          ? (weightDualPricing && weightNewSalePrice ? parseFloat(weightNewSalePrice) : parseFloat(weightSalePrice)) || 0
          : (unitLevels[0].dualPricing && unitLevels[0].newSalePrice
              ? parseFloat(unitLevels[0].newSalePrice)
              : parseFloat(unitLevels[0].salePrice)) || 0;

      const oldSPrice =
        itemTypeMode === 'weight'
          ? weightDualPricing && weightOldSalePrice ? parseFloat(weightOldSalePrice) : undefined
          : unitLevels[0].dualPricing && unitLevels[0].oldSalePrice
          ? parseFloat(unitLevels[0].oldSalePrice)
          : undefined;

      const hasDual =
        itemTypeMode === 'weight'
          ? weightDualPricing
          : unitLevels[0].dualPricing;

      const cleanAlternateBarcodes = alternateBarcodes
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const targetWarehouseId =
        warehouses.find((w) => w.is_main)?.id || warehouses[0]?.id || 'main-warehouse';

      const baseProductData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sync_status'> = {
        org_id: orgId,
        sku: sku.trim() || generateSku(name),
        name: name.trim(),
        name_en: showSpecs && nameEn.trim() ? nameEn.trim() : undefined,
        scientific_name: showSpecs && scientificName.trim() ? scientificName.trim() : undefined,
        shelf_location: showSpecs && shelfLocation.trim() ? shelfLocation.trim() : undefined,
        image_url: imageUrl || undefined,
        alternate_barcodes: cleanAlternateBarcodes.length > 0 ? cleanAlternateBarcodes : undefined,
        category_id: categoryId !== 'none' ? categoryId : null,
        brand_id: brandId !== 'none' ? brandId : null,
        item_type: 'storable',
        product_type: productType !== 'none' ? productType : undefined,
        measurement_type: itemTypeMode,
        has_levels: itemTypeMode === 'unit' && unitLevels.length > 1,
        scale_code: itemTypeMode === 'weight' && scaleCode.trim() ? scaleCode.trim() : undefined,
        base_unit_id: baseU.id,
        purchase_price: pPrice,
        sale_price: sPrice,
        old_sale_price: oldSPrice,
        has_dual_pricing: hasDual,
        tax_rate: isTaxable ? 14 : 0,
        is_tax_inclusive: false,
        is_taxable: isTaxable,
        tracks_batch: showExpiry && enableExpiryTracking,
        tracks_expiry: showExpiry && enableExpiryTracking,
        min_stock_alert: enableMinStockAlert ? parseFloat(minStockAlert) || 5 : 0,
        is_active: isActiveForSale,
        is_quick_pos: isQuickPos,
        notes: productNotes.trim() || undefined,
      };

      // المستويات الفرعية (بحد أقصى 3 مستويات إجمالاً)
      const secondaryUnitsData: Omit<
        ProductUnit,
        'id' | 'product_id' | 'created_at' | 'updated_at' | 'sync_status'
      >[] = [];

      if (itemTypeMode === 'unit' && unitLevels.length > 1) {
        for (let i = 1; i < Math.min(3, unitLevels.length); i++) {
          const lvl = unitLevels[i];
          if (!lvl.unitName.trim()) continue;
          let subU = units.find((u) => u.name === lvl.unitName);
          if (!subU) {
            subU = await ProductRepository.createUnit(lvl.unitName, lvl.unitName.slice(0, 3), orgId);
          }
          const secondarySale = lvl.dualPricing && lvl.newSalePrice
            ? parseFloat(lvl.newSalePrice)
            : (lvl.salePrice ? parseFloat(lvl.salePrice) : undefined);
          const secondaryOldSale = lvl.dualPricing && lvl.oldSalePrice
            ? parseFloat(lvl.oldSalePrice)
            : undefined;

          secondaryUnitsData.push({
            unit_id: subU.id,
            conversion_factor: parseFloat(lvl.conversionFactor) || 1,
            purchase_price: lvl.purchasePrice ? parseFloat(lvl.purchasePrice) : undefined,
            sale_price: secondarySale,
            old_sale_price: secondaryOldSale,
            has_dual_pricing: lvl.dualPricing,
            is_default_sale: lvl.allowSale,
            is_default_purchase: false,
          });
        }
      }

      // تجهيز تشغيلات الصلاحية (تدعم القطع والوزن بالميزان)
      const preparedBatches: Array<{
        warehouse_id: string;
        batch_number: string;
        expiry_date?: string | null;
        initial_quantity: number;
        purchase_price?: number;
      }> = [];

      if (showExpiry && enableExpiryTracking && batchEntries.length > 0) {
        for (let i = 0; i < batchEntries.length; i++) {
          const b = batchEntries[i];
          const rawQty = parseFloat(b.quantity) || 0;
          if (rawQty <= 0) continue;

          let factor = 1;
          if (itemTypeMode === 'unit') {
            if (b.unitLevelId === 'level-2' && unitLevels[1]) {
              factor = 1 / (parseFloat(unitLevels[1].conversionFactor) || 1);
            } else if (b.unitLevelId === 'level-3' && unitLevels[2]) {
              const f2 = parseFloat(unitLevels[1]?.conversionFactor) || 1;
              const f3 = parseFloat(unitLevels[2].conversionFactor) || 1;
              factor = 1 / (f2 * f3);
            }
          }

          let expiryIso: string | null = null;
          if (b.year && b.month && b.day) {
            const y = b.year.trim().padStart(4, '20');
            const m = b.month.trim().padStart(2, '0');
            const d = b.day.trim().padStart(2, '0');
            expiryIso = `${y}-${m}-${d}`;
          }

          preparedBatches.push({
            warehouse_id: targetWarehouseId,
            batch_number: b.batchNumber.trim() || `BATCH-${Date.now().toString().slice(-4)}-${i + 1}`,
            expiry_date: expiryIso,
            initial_quantity: rawQty * factor,
            purchase_price: pPrice,
          });
        }
      }

      if (isEdit && initial) {
        await ProductRepository.updateProduct(initial.id, baseProductData);
        await ProductRepository.replaceProductUnits(initial.id, secondaryUnitsData);
        if (preparedBatches.length > 0) {
          await ProductRepository.saveProductBatches(initial.id, orgId, preparedBatches);
        }
      } else {
        const savedProduct = await ProductRepository.createProduct(
          baseProductData,
          secondaryUnitsData,
          preparedBatches
        );
        if (preparedBatches.length > 0) {
          await ProductRepository.saveProductBatches(savedProduct.id, orgId, preparedBatches);
        }
      }

      toast.success('تم حفظ الصنف بنجاح!');
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الصنف.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      {/* ========================================================================= */}
      {/* 1. شريط تخصيص واجهة الإدخال: ديفولت أزراره كلها false لتبسيط الإدخال */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>تخصيص واجهة الإدخال:</span>
          </div>

          {/* تبديل: المواصفات الإضافية (Default: false) */}
          <button
            type="button"
            onClick={() => setShowSpecs(!showSpecs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              showSpecs
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>المواصفات الإضافية</span>
            {showSpecs && <Check className="w-3 h-3" />}
          </button>

          {/* تبديل: الإعدادات المتقدمة (Default: false) */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              showAdvanced
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الإعدادات المتقدمة</span>
            {showAdvanced && <Check className="w-3 h-3" />}
          </button>

          {/* تبديل: تتبع الصلاحية (Default: false) */}
          <button
            type="button"
            onClick={() => {
              const next = !showExpiry;
              setShowExpiry(next);
              setEnableExpiryTracking(next);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              showExpiry
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تتبع الصلاحية</span>
            {showExpiry && <Check className="w-3 h-3" />}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
          قم بتفعيل ما تحتاجه فقط لتبسيط وتسريع عملية الإدخال
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. نوع الصنف وطبيعة البيع (قطع أو وزن بالميزان) لكافة الأنشطة التجارية */}
      {/* ========================================================================= */}
      <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <Label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-3">
            اختر نوع الصنف وطبيعة البيع *
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* خيار 1: صنف بالقطعة / الوحدات المتعددة */}
            <div
              onClick={() => setItemTypeMode('unit')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                itemTypeMode === 'unit'
                  ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  itemTypeMode === 'unit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    صنف بالقطعة (وحدات متعددة)
                  </h4>
                  {itemTypeMode === 'unit' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  قطعة، كرتونة، باكت، دستة، علبة، طرد مع معامل التفكيك وتعدد المستويات
                </p>
              </div>
            </div>

            {/* خيار 2: صنف بالوزن (ميزان إلكتروني) */}
            <div
              onClick={() => setItemTypeMode('weight')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                itemTypeMode === 'weight'
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  itemTypeMode === 'weight'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    صنف بالوزن (ميزان / كيلو)
                  </h4>
                  {itemTypeMode === 'weight' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  يباع بالوزن والميزان الإلكتروني (كيلو، جرام، طن)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 3. كرت البيانات الأساسية والباركود والصورة */}
      {/* ========================================================================= */}
      <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs overflow-hidden">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* صندوق صورة الصنف */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-4/3 sm:aspect-square max-w-[190px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all relative overflow-hidden group shadow-2xs"
              >
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={name || 'صورة الصنف'}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl('');
                        }}
                        className="w-8 h-8 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-2xs">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      صورة الصنف
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      انقر للرفع (PNG, JPG)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* الحقول الأساسية: الاسم والباركود والرف والمواصفات */}
            <div className="lg:col-span-9 space-y-4">
              {/* السطر الأول: الاسم الرئيسي مع المواصفات إن فُعّلت */}
              <div className={`grid grid-cols-1 ${showSpecs ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-3`}>
                <div>
                  <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم الصنف *
                  </Label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: قميص قطن، جبن، شاي، لابتوب، دواء..."
                    className="h-11 text-xs font-bold rounded-xl"
                  />
                </div>

                {showSpecs && (
                  <>
                    <div>
                      <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        الوصف الإضافي / المواصفات
                      </Label>
                      <Input
                        type="text"
                        value={scientificName}
                        onChange={(e) => setScientificName(e.target.value)}
                        placeholder="وصف إضافي، ماركة، مواصفات، أو مادة فعالة"
                        className="h-11 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        اسم الصنف (بالإنجليزي)
                      </Label>
                      <Input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="Product Name in English"
                        dir="ltr"
                        className="h-11 text-xs text-left rounded-xl"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* السطر الثاني: الباركود والمكان / الرف */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <div className={showSpecs ? 'sm:col-span-7' : 'sm:col-span-12'}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      الباركود الرئيسي
                    </Label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomBarcode}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>توليد باركود تلقائي</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="الباركود الدولي أو المحلي (اختياري)"
                      className="h-11 text-xs font-mono rounded-xl pl-9"
                    />
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  </div>

                  {/* زر إضافة باركود بديل */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleAddAlternateBarcode}
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>إضافة باركود بديل</span>
                    </button>

                    {alternateBarcodes.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {alternateBarcodes.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={b}
                              onChange={(e) => handleUpdateAlternateBarcode(bIdx, e.target.value)}
                              placeholder={`باركود بديل ${bIdx + 1}`}
                              className="h-9 text-xs font-mono rounded-lg flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAlternateBarcode(bIdx)}
                              className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {showSpecs && (
                  <div className="sm:col-span-5">
                    <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      مكان التخزين / الرف / القسم
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={shelfLocation}
                        onChange={(e) => setShelfLocation(e.target.value)}
                        placeholder="مثال: رف A-12 / قسم 3"
                        className="h-11 text-xs rounded-xl pl-9"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 4. الشاشة الوسطى: التصنيفات والإعدادات (يسار) والوحدات والتسعير (يمين) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* العمود الأيسر: التصنيفات + الإعدادات المتقدمة (إن فُعّلت) */}
        <div className="lg:col-span-4 space-y-4">
          {/* كرت التصنيفات والبيانات */}
          <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>التصنيفات والبيانات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* 1. الشركة / الماركة / المورد */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    الشركة المصنعة / الماركة
                  </Label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('brand')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة / إدارة</span>
                  </button>
                </div>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="اختر من القائمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تحديد</SelectItem>
                    {uniqueBrands.map((b) => (
                      <SelectItem key={`brand-${b.id}`} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. المجموعة / التصنيف */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    المجموعة / التصنيف
                  </Label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('category')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة / إدارة</span>
                  </button>
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="اختر من القائمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تحديد</SelectItem>
                    {uniqueCategories.map((c) => (
                      <SelectItem key={`cat-${c.id}`} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. نوع المنتج */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    نوع المنتج
                  </Label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('product_type')}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة / إدارة</span>
                  </button>
                </div>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="اختر من القائمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تحديد</SelectItem>
                    {uniqueProductTypes.map((t) => (
                      <SelectItem key={`type-${t.id}`} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* كرت الإعدادات المتقدمة (يظهر فقط إذا اختار المستخدم تفعيله) */}
          {showAdvanced && (
            <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600" />
                  <span>إعدادات متقدمة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* صنف ضريبي */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <Label htmlFor="taxable-switch" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                        صنف ضريبي
                      </Label>
                      <p className="text-[10px] text-slate-500">خاضع لضريبة القيمة المضافة (14%)</p>
                    </div>
                  </div>
                  <Switch
                    id="taxable-switch"
                    checked={isTaxable}
                    onCheckedChange={setIsTaxable}
                  />
                </div>

                {/* تفعيل تنبيهات النواقص */}
                <div className="space-y-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <Label htmlFor="min-stock-switch" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                          تفعيل تنبيهات النواقص
                        </Label>
                        <p className="text-[10px] text-slate-500">إظهار إشعار عند وصول الصنف للحد الأدنى أو نفاده</p>
                      </div>
                    </div>
                    <Switch
                      id="min-stock-switch"
                      checked={enableMinStockAlert}
                      onCheckedChange={setEnableMinStockAlert}
                    />
                  </div>

                  {enableMinStockAlert && (
                    <div className="pt-2">
                      <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        حد تنبيه النواقص (بالوحدة الأساسية)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          value={minStockAlert}
                          onChange={(e) => setMinStockAlert(e.target.value)}
                          className="h-10 text-xs font-mono font-bold pl-8"
                        />
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* صنف نشط في البيع */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <Label htmlFor="active-sale-switch" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                        صنف نشط في البيع
                      </Label>
                      <p className="text-[10px] text-slate-500">إتاحة الصنف للبيع والبحث بالفواتير</p>
                    </div>
                  </div>
                  <Switch
                    id="active-sale-switch"
                    checked={isActiveForSale}
                    onCheckedChange={setIsActiveForSale}
                  />
                </div>

                {/* صنف سريع (POS Quick Access) */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <Label htmlFor="quick-pos-switch" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                        صنف سريع (POS Quick Access)
                      </Label>
                      <p className="text-[10px] text-slate-500">إظهار الصنف في قائمة الوصول السريع بشاشة الكاشير</p>
                    </div>
                  </div>
                  <Switch
                    id="quick-pos-switch"
                    checked={isQuickPos}
                    onCheckedChange={setIsQuickPos}
                  />
                </div>

                {/* ملاحظات الصنف */}
                <div>
                  <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ملاحظات الصنف
                  </Label>
                  <textarea
                    rows={2}
                    value={productNotes}
                    onChange={(e) => setProductNotes(e.target.value)}
                    placeholder="أي تعليمات أو ملاحظات إضافية..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* العمود الأيمن: كروت تسعير الوحدات (للقطع) أو تسعير الوزن (للميزان) */}
        <div className="lg:col-span-8 space-y-4">
          {itemTypeMode === 'unit' ? (
            <>
              {unitLevels.map((lvl, idx) => {
                const isFirst = idx === 0;
                const activeSale = lvl.dualPricing ? (lvl.newSalePrice || lvl.salePrice) : lvl.salePrice;
                const margin = calculateMargin(lvl.purchasePrice, activeSale);

                return (
                  <Card
                    key={lvl.id}
                    className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs overflow-hidden"
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* السطر 1: الشارة، اسم الوحدة، معامل التفكيك، الرصيد، سويتش مسموح بالبيع */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isFirst
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div className="flex-1">
                            <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                              اسم الوحدة {isFirst ? '(الأساسية / الكبرى)' : `(المستوى ${idx + 1})`}
                            </Label>
                            <Input
                              type="text"
                              value={lvl.unitName}
                              onChange={(e) => updateUnitLevel(idx, { unitName: e.target.value })}
                              placeholder={isFirst ? 'مثال: قطعة، كرتونة، كجم...' : 'مثال: باكت، شريط، جرام...'}
                              className="h-10 text-xs font-bold"
                            />
                          </div>

                          {!isFirst && (
                            <div className="w-32">
                              <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                معامل التفكيك
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={1}
                                  value={lvl.conversionFactor}
                                  onChange={(e) =>
                                    updateUnitLevel(idx, { conversionFactor: e.target.value })
                                  }
                                  placeholder=""
                                  className="h-10 text-xs font-mono font-bold pr-3 pl-8"
                                />
                                {lvl.conversionFactor && (
                                  <button
                                    type="button"
                                    onClick={() => updateUnitLevel(idx, { conversionFactor: '' })}
                                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="w-28">
                            <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                              الرصيد الافتتاحي
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                value={lvl.openingStock}
                                onChange={(e) =>
                                  updateUnitLevel(idx, { openingStock: e.target.value })
                                }
                                placeholder=""
                                className="h-10 text-xs font-mono font-bold pr-3 pl-8"
                              />
                              {lvl.openingStock !== '' && (
                                <button
                                  type="button"
                                  onClick={() => updateUnitLevel(idx, { openingStock: '' })}
                                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={lvl.allowSale}
                              onCheckedChange={(checked) =>
                                updateUnitLevel(idx, { allowSale: checked })
                              }
                              id={`allow-sale-${idx}`}
                            />
                            <Label
                              htmlFor={`allow-sale-${idx}`}
                              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer"
                            >
                              مسموح بالبيع
                            </Label>
                          </div>

                          {!isFirst && (
                            <button
                              type="button"
                              onClick={() => removeUnitLevel(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                              title="حذف هذا المستوى"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* السطر 2: سعر الشراء، الخصم، وسويتش تسعير مزدوج */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            سعر الشراء
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={lvl.purchasePrice}
                            onChange={(e) => updateUnitLevel(idx, { purchasePrice: e.target.value })}
                            placeholder=""
                            className="h-10 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            الخصم
                          </Label>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              value={lvl.discountValue}
                              onChange={(e) =>
                                updateUnitLevel(idx, { discountValue: e.target.value })
                              }
                              placeholder=""
                              className="h-10 text-xs font-mono flex-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateUnitLevel(idx, {
                                  discountType: lvl.discountType === 'percent' ? 'amount' : 'percent',
                                })
                              }
                              className="h-10 px-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shrink-0 cursor-pointer"
                            >
                              {lvl.discountType === 'percent' ? '%' : 'ج.م'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            تسعير مزدوج
                          </span>
                          <Switch
                            checked={lvl.dualPricing}
                            onCheckedChange={(checked) =>
                              updateUnitLevel(idx, { dualPricing: checked })
                            }
                          />
                        </div>
                      </div>

                      {/* السطر 3: أسعار البيع وهامش الربح */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {lvl.dualPricing ? (
                          <>
                            <div className="sm:col-span-5">
                              <Label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                سعر البيع القديم
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={lvl.oldSalePrice}
                                onChange={(e) =>
                                  updateUnitLevel(idx, { oldSalePrice: e.target.value })
                                }
                                placeholder=""
                                className="h-11 text-sm font-mono font-bold text-slate-700 dark:text-slate-300"
                              />
                            </div>

                            <div className="sm:col-span-5">
                              <Label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                سعر البيع الجديد *
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={lvl.newSalePrice}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateUnitLevel(idx, { newSalePrice: val, salePrice: val });
                                }}
                                placeholder=""
                                className="h-11 text-sm font-mono font-black text-slate-900 dark:text-white"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="sm:col-span-10">
                            <Label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              سعر البيع الحالي *
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              value={lvl.salePrice}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateUnitLevel(idx, { salePrice: val, newSalePrice: val });
                              }}
                              placeholder=""
                              className="h-11 text-sm font-mono font-black text-slate-900 dark:text-white"
                            />
                          </div>
                        )}

                        <div className="sm:col-span-2 h-11 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col items-center justify-center p-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>هامش الربح</span>
                          </div>
                          <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-300">
                            {margin}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* زر إضافة وحدة أصغر (بحد أقصى 3 مستويات) */}
              {unitLevels.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddSmallerUnit}
                  className="w-full py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة وحدة أصغر (المستوى {unitLevels.length + 1})</span>
                </button>
              )}
            </>
          ) : (
            /* كرت الأصناف بالوزن (ميزان إلكتروني / كيلو) */
            <Card className="border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#131b2e] shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>بيانات تسعير الوزن (كيلوجرام / ميزان إلكتروني)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      الوحدة الأساسية
                    </Label>
                    <Input
                      type="text"
                      disabled
                      value={weightUnitName}
                      className="h-11 font-bold text-xs opacity-75"
                    />
                  </div>

                  <div>
                    <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      الرصيد الافتتاحي (كجم)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={weightOpeningStock}
                      onChange={(e) => setWeightOpeningStock(e.target.value)}
                      placeholder=""
                      className="h-11 text-sm font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="block text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
                      كود الميزان الإلكتروني (PLU)
                    </Label>
                    <Input
                      type="text"
                      value={scaleCode}
                      onChange={(e) => setScaleCode(e.target.value)}
                      placeholder="كود الباركود الوزني"
                      className="h-11 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      سعر شراء الكيلو
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={weightPurchasePrice}
                      onChange={(e) => setWeightPurchasePrice(e.target.value)}
                      placeholder=""
                      className="h-11 text-sm font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      تسعير مزدوج
                    </span>
                    <Switch
                      checked={weightDualPricing}
                      onCheckedChange={setWeightDualPricing}
                    />
                  </div>

                  <div>
                    <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      الخصم
                    </Label>
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        value={weightDiscount}
                        onChange={(e) => setWeightDiscount(e.target.value)}
                        placeholder=""
                        className="h-11 text-xs font-mono flex-1"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setWeightDiscountType((prev) => (prev === 'percent' ? 'amount' : 'percent'))
                        }
                        className="h-11 px-3 rounded-xl bg-blue-600 text-white text-xs font-black shrink-0 cursor-pointer"
                      >
                        {weightDiscountType === 'percent' ? '%' : 'ج.م'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {weightDualPricing ? (
                    <>
                      <div className="sm:col-span-5">
                        <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          سعر بيع الكيلو القديم
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={weightOldSalePrice}
                          onChange={(e) => setWeightOldSalePrice(e.target.value)}
                          placeholder=""
                          className="h-11 text-sm font-mono font-bold text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          سعر بيع الكيلو الجديد *
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={weightNewSalePrice}
                          onChange={(e) => {
                            setWeightNewSalePrice(e.target.value);
                            setWeightSalePrice(e.target.value);
                          }}
                          placeholder=""
                          className="h-11 text-sm font-mono font-black text-blue-600"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-10">
                      <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        سعر بيع الكيلو الحالي *
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={weightSalePrice}
                        onChange={(e) => {
                          setWeightSalePrice(e.target.value);
                          setWeightNewSalePrice(e.target.value);
                        }}
                        placeholder=""
                        className="h-11 text-sm font-mono font-black text-emerald-600"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2 h-11 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center p-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>هامش الربح</span>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-300">
                      {calculateMargin(
                        weightPurchasePrice,
                        weightDualPricing ? (weightNewSalePrice || weightSalePrice) : weightSalePrice
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. كرت تواريخ الصلاحية والتشغيلات (يظهر فقط إذا فُعّل التتبع) */}
      {/* قابل للنوعين: القطع (مستويات) أو بالميزان (كيلو) */}
      {/* ========================================================================= */}
      {showExpiry && (
        <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>تواريخ الصلاحية والتشغيلات</span>
              </CardTitle>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تفعيل تتبع الصلاحية والتشغيلات
                </span>
                <Switch
                  checked={enableExpiryTracking}
                  onCheckedChange={setEnableExpiryTracking}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {enableExpiryTracking ? (
              <div className="space-y-4">
                {batchEntries.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>
                      لم تتم إضافة أي تواريخ صلاحية بعد. اضغط على &apos;[إضافة تاريخ جديد]&apos; بالأسفل.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batchEntries.map((b, idx) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap lg:flex-nowrap items-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveBatch(idx)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                          title="حذف هذا التاريخ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="w-28 shrink-0">
                          <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                            الكمية
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            step="any"
                            value={b.quantity}
                            onChange={(e) => handleUpdateBatch(idx, { quantity: e.target.value })}
                            placeholder="1"
                            className="h-10 text-xs font-mono font-bold"
                          />
                        </div>

                        {/* الوحدة المرتبطة: تدعم الوحدات المتعددة للقطع أو الميزان */}
                        <div className="flex-1 min-w-[200px]">
                          <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                            الوحدة المرتبطة
                          </Label>
                          <Select
                            value={b.unitLevelId}
                            onValueChange={(val) => handleUpdateBatch(idx, { unitLevelId: val })}
                          >
                            <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">
                              <SelectValue placeholder="اختر الوحدة..." />
                            </SelectTrigger>
                            <SelectContent>
                              {itemTypeMode === 'unit' ? (
                                <>
                                  <SelectItem value="level-1">
                                    {unitLevels[0]?.unitName ? `${unitLevels[0].unitName} (المستوى 1)` : 'الوحدة الأساسية (المستوى 1)'}
                                  </SelectItem>
                                  {unitLevels.length > 1 && (
                                    <SelectItem value="level-2">
                                      {unitLevels[1]?.unitName ? `${unitLevels[1].unitName} (المستوى 2)` : 'المستوى 2'}
                                    </SelectItem>
                                  )}
                                  {unitLevels.length > 2 && (
                                    <SelectItem value="level-3">
                                      {unitLevels[2]?.unitName ? `${unitLevels[2].unitName} (المستوى 3)` : 'المستوى 3'}
                                    </SelectItem>
                                  )}
                                </>
                              ) : (
                                <SelectItem value="weight">
                                  كيلوجرام (كجم)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* تاريخ الصلاحية: [يوم] [شهر] [سنة] مع أيقونة التقويم */}
                        <div className="flex-1 min-w-[240px]">
                          <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                            تاريخ الصلاحية
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex items-center">
                              <input
                                type="date"
                                value={
                                  b.year && b.month && b.day
                                    ? `${b.year.padStart(4, '20')}-${b.month.padStart(2, '0')}-${b.day.padStart(2, '0')}`
                                    : ''
                                }
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const [y, m, d] = e.target.value.split('-');
                                    handleUpdateBatch(idx, { year: y, month: m, day: d });
                                  }
                                }}
                                className="w-10 h-10 p-0 opacity-0 absolute inset-0 cursor-pointer z-10"
                              />
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 pointer-events-none">
                                <Calendar className="w-4 h-4" />
                              </div>
                            </div>

                            <Input
                              type="number"
                              min={2024}
                              max={2040}
                              value={b.year}
                              onChange={(e) => handleUpdateBatch(idx, { year: e.target.value })}
                              placeholder="سنة"
                              className="h-10 text-xs font-mono font-bold text-center w-20"
                            />

                            <Input
                              type="number"
                              min={1}
                              max={12}
                              value={b.month}
                              onChange={(e) => handleUpdateBatch(idx, { month: e.target.value })}
                              placeholder="شهر"
                              className="h-10 text-xs font-mono font-bold text-center w-16"
                            />

                            <Input
                              type="number"
                              min={1}
                              max={31}
                              value={b.day}
                              onChange={(e) => handleUpdateBatch(idx, { day: e.target.value })}
                              placeholder="يوم"
                              className="h-10 text-xs font-mono font-bold text-center w-16"
                            />
                          </div>
                        </div>

                        {/* رقم التشغيلة */}
                        <div className="w-36 shrink-0">
                          <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                            رقم التشغيلة
                          </Label>
                          <Input
                            type="text"
                            value={b.batchNumber}
                            onChange={(e) => handleUpdateBatch(idx, { batchNumber: e.target.value })}
                            placeholder="توليد تلقائي"
                            className="h-10 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-center pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddBatch}
                    className="h-11 px-6 rounded-xl border-dashed border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تاريخ جديد</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">
                تتبع الصلاحية متوقف لهذا الصنف حالياً.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 6. شريط الإجراءات السفلي */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-12 px-8 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>حفظ الصنف النهائي</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </Button>
        </div>

        <Button
          type="button"
          onClick={handleResetForm}
          className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>تفريغ البيانات</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 7. نافذة الإضافة والإدارة المنبثقة للتصنيفات والشركات والأنواع مع إمكانية الحذف */}
      {/* ========================================================================= */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white dark:bg-[#131b2e] border border-slate-100 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                <SquarePen className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activeModal === 'brand' && 'إدارة وإضافة الشركات المصنعة / الماركات'}
                {activeModal === 'category' && 'إدارة وإضافة المجموعات / التصنيفات'}
                {activeModal === 'product_type' && 'إدارة وإضافة أنواع المنتجات'}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* إضافة جديد */}
          <div className="mt-4 space-y-2 text-right" dir="rtl">
            <Label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              إضافة اسم جديد
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                autoFocus
                value={modalInputValue}
                onChange={(e) => setModalInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleModalSave();
                  }
                }}
                placeholder="اكتب الاسم واضغط إضافة..."
                className="h-11 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm px-4 bg-white dark:bg-slate-900 flex-1"
              />
              <Button
                type="button"
                disabled={isModalSaving || !modalInputValue.trim()}
                onClick={handleModalSave}
                className="h-11 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isModalSaving ? 'إضافة...' : 'إضافة'}
              </Button>
            </div>
          </div>

          {/* قائمة العناصر الحالية مع زر الحذف للتخلص من أي بيانات تجريبية أو قديمة */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-right" dir="rtl">
            <Label className="block text-xs font-bold text-slate-500 mb-2">
              العناصر المسجلة حالياً (يمكنك حذف أي عنصر):
            </Label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {activeModal === 'brand' &&
                (uniqueBrands.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">لا توجد عناصر مسجلة بعد</p>
                ) : (
                  uniqueBrands.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">{b.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLookupItem('brand', b.id, b.name)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ))}

              {activeModal === 'category' &&
                (uniqueCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">لا توجد عناصر مسجلة بعد</p>
                ) : (
                  uniqueCategories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLookupItem('category', c.id, c.name)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ))}

              {activeModal === 'product_type' &&
                (uniqueProductTypes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">لا توجد عناصر مسجلة بعد</p>
                ) : (
                  uniqueProductTypes.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLookupItem('product_type', t.id, t.name)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ))}
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-800" dir="rtl">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveModal(null)}
              className="h-10 px-6 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

function generateSku(name: string): string {
  const prefix =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.slice(0, 1))
      .join('')
      .toUpperCase() || 'ITM';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}