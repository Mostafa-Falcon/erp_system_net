import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from '@/modules/inventory/product_repository';
import type {
  Product,
  ProductCategory,
  ProductBrand,
  ProductTypeItem,
  ProductUnit,
  ProductBatch,
} from '@/types';
import type {
  ProductFormProps,
  UnitLevelItem,
  FormBatchEntry,
  ModalType,
  ItemTypeMode,
} from './types';
import { generateSku } from './utils';

export function useProductForm({
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
}: ProductFormProps) {
  const isEdit = !!initial;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 1. شريط التخصيص العلوي
  // =========================================================================
  const [showSpecs, setShowSpecs] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);

  // =========================================================================
  // 2. القوائم المنسدلة والربط مع المؤسسة
  // =========================================================================
  const [localBrands, setLocalBrands] = useState<ProductBrand[]>(brands);
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(categories);
  const [localProductTypes, setLocalProductTypes] = useState<ProductTypeItem[]>(productTypes || []);

  useEffect(() => {
    setLocalBrands(brands || []);
  }, [brands]);

  useEffect(() => {
    setLocalCategories(categories || []);
  }, [categories]);

  useEffect(() => {
    setLocalProductTypes(productTypes || []);
  }, [productTypes]);

  const uniqueProductTypes = useMemo(() => {
    const map = new Map<string, ProductTypeItem>();
    for (const item of localProductTypes) {
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [localProductTypes]);

  const uniqueBrands = useMemo(() => {
    const map = new Map<string, ProductBrand>();
    for (const item of localBrands) {
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [localBrands]);

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    for (const item of localCategories) {
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [localCategories]);

  // =========================================================================
  // 3. بيانات الصنف الأساسية
  // =========================================================================
  const [itemTypeMode, setItemTypeMode] = useState<ItemTypeMode>(
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

  // تتبع الصلاحية والتشغيلات
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

  const handleDeleteLookupItem = async (
    type: 'brand' | 'category' | 'product_type',
    id: string,
    deletedName: string
  ) => {
    try {
      if (type === 'brand') {
        await ProductRepository.deleteBrand(id);
        setLocalBrands((prev) => prev.filter((x) => x.id !== id));
        if (brandId === id) setBrandId('none');
        toast.info(`تم حذف "${deletedName}"`);
      } else if (type === 'category') {
        await ProductRepository.deleteCategory(id);
        setLocalCategories((prev) => prev.filter((x) => x.id !== id));
        if (categoryId === id) setCategoryId('none');
        toast.info(`تم حذف "${deletedName}"`);
      } else if (type === 'product_type') {
        await ProductRepository.deleteProductType(id);
        setLocalProductTypes((prev) => prev.filter((x) => x.id !== id));
        if (productType === deletedName) setProductType('none');
        toast.info(`تم حذف "${deletedName}"`);
      }
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف العنصر');
    }
  };

  // =========================================================================
  // 4. حالة وحدات القطع
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
    ];
  });

  // حالة الوزن (كيلو / ميزان إلكتروني)
  const weightUnitName = 'كيلوجرام (كجم)';
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

  // توليد باركود تلقائي
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

  return {
    isEdit,
    fileInputRef,
    // Bar
    showSpecs,
    setShowSpecs,
    showAdvanced,
    setShowAdvanced,
    showExpiry,
    setShowExpiry,
    // Lookups
    uniqueBrands,
    uniqueCategories,
    uniqueProductTypes,
    // Basic info
    itemTypeMode,
    setItemTypeMode,
    name,
    setName,
    nameEn,
    setNameEn,
    scientificName,
    setScientificName,
    sku,
    setSku,
    alternateBarcodes,
    shelfLocation,
    setShelfLocation,
    imageUrl,
    setImageUrl,
    categoryId,
    setCategoryId,
    brandId,
    setBrandId,
    productType,
    setProductType,
    // Advanced
    isTaxable,
    setIsTaxable,
    enableMinStockAlert,
    setEnableMinStockAlert,
    minStockAlert,
    setMinStockAlert,
    isActiveForSale,
    setIsActiveForSale,
    isQuickPos,
    setIsQuickPos,
    productNotes,
    setProductNotes,
    // Expiry
    enableExpiryTracking,
    setEnableExpiryTracking,
    batchEntries,
    // Modal
    activeModal,
    setActiveModal,
    modalInputValue,
    setModalInputValue,
    isModalSaving,
    handleModalSave,
    handleDeleteLookupItem,
    // Unit levels
    unitLevels,
    handleAddSmallerUnit,
    updateUnitLevel,
    removeUnitLevel,
    // Weight
    weightUnitName,
    scaleCode,
    setScaleCode,
    weightOpeningStock,
    setWeightOpeningStock,
    weightPurchasePrice,
    setWeightPurchasePrice,
    weightDiscount,
    setWeightDiscount,
    weightDiscountType,
    setWeightDiscountType,
    weightSalePrice,
    setWeightSalePrice,
    weightOldSalePrice,
    setWeightOldSalePrice,
    weightNewSalePrice,
    setWeightNewSalePrice,
    weightDualPricing,
    setWeightDualPricing,
    // Actions & state
    isSaving,
    handleGenerateRandomBarcode,
    handleAddAlternateBarcode,
    handleUpdateAlternateBarcode,
    handleRemoveAlternateBarcode,
    handleImageUpload,
    handleAddBatch,
    handleUpdateBatch,
    handleRemoveBatch,
    handleResetForm,
    handleSubmit,
    onCancel,
  };
}
