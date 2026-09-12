import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SquarePen, X, Trash2 } from 'lucide-react';
import type { ProductBrand, ProductCategory, ProductTypeItem } from '@/types';
import type { ModalType } from '../types';

interface LookupManageModalProps {
  activeModal: ModalType;
  setActiveModal: (type: ModalType) => void;
  modalInputValue: string;
  setModalInputValue: (val: string) => void;
  isModalSaving: boolean;
  handleModalSave: () => Promise<void>;
  handleDeleteLookupItem: (
    type: 'brand' | 'category' | 'product_type',
    id: string,
    name: string
  ) => Promise<void>;
  uniqueBrands: ProductBrand[];
  uniqueCategories: ProductCategory[];
  uniqueProductTypes: ProductTypeItem[];
}

export const LookupManageModal: React.FC<LookupManageModalProps> = ({
  activeModal,
  setActiveModal,
  modalInputValue,
  setModalInputValue,
  isModalSaving,
  handleModalSave,
  handleDeleteLookupItem,
  uniqueBrands,
  uniqueCategories,
  uniqueProductTypes,
}) => {
  return (
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
  );
};
