import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { ProductBrand, ProductCategory, ProductTypeItem } from '@/types';
import type { ModalType } from '../types';

interface ClassificationsSectionProps {
  brandId: string;
  setBrandId: (val: string) => void;
  uniqueBrands: ProductBrand[];
  categoryId: string;
  setCategoryId: (val: string) => void;
  uniqueCategories: ProductCategory[];
  productType: string;
  setProductType: (val: string) => void;
  uniqueProductTypes: ProductTypeItem[];
  setActiveModal: (type: ModalType) => void;
}

export const ClassificationsSection: React.FC<ClassificationsSectionProps> = ({
  brandId,
  setBrandId,
  uniqueBrands,
  categoryId,
  setCategoryId,
  uniqueCategories,
  productType,
  setProductType,
  uniqueProductTypes,
  setActiveModal,
}) => {
  return (
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
  );
};
