import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Package, Scale } from 'lucide-react';
import type { ItemTypeMode } from '../types';

interface ItemTypeSelectorProps {
  itemTypeMode: ItemTypeMode;
  setItemTypeMode: (mode: ItemTypeMode) => void;
}

export const ItemTypeSelector: React.FC<ItemTypeSelectorProps> = ({
  itemTypeMode,
  setItemTypeMode,
}) => {
  return (
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
  );
};
