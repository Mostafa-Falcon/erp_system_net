'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Boxes, Save, Plus } from 'lucide-react';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { toast } from 'sonner';
import type { Product, Warehouse } from '@/types';

interface OpeningStockModalProps {
  product: Product | null;
  warehouses: Warehouse[];
  unitName: (id?: string | null) => string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpeningStockModal({
  product,
  warehouses,
  unitName,
  onClose,
  onSuccess,
}: OpeningStockModalProps) {
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(product?.purchase_price || 0);
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error('يرجى اختيار المخزن.');
      return;
    }
    if (quantity <= 0) {
      toast.error('يرجى إدخال كمية صالحة أكبر من الصفر.');
      return;
    }

    try {
      setIsSubmitting(true);
      await ProductRepository.saveProductBatches(product.id, product.org_id, [
        {
          warehouse_id: warehouseId,
          batch_number: batchNumber.trim() || `OP-${Date.now().toString().slice(-6)}`,
          expiry_date: expiryDate || null,
          initial_quantity: quantity,
          purchase_price: purchasePrice,
        },
      ]);
      toast.success(`تم تسجيل رصيد البداية للصنف (${product.name}) بنجاح.`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save opening stock:', err);
      toast.error('حدث خطأ أثناء حفظ رصيد البداية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>إضافة كميات افتتاحية (رصيد بداية)</span>
          </DialogTitle>
          <p className="text-xs text-slate-500 font-bold">
            الصنف: <span className="text-blue-600 font-black">{product.name}</span> ({unitName(product.base_unit_id)})
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Warehouse */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              المخزن المستهدف <span className="text-red-500">*</span>
            </Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold text-right">
                <SelectValue placeholder="اختر المخزن" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#131b2e] z-50">
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                الكمية الافتتاحية <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0.01"
                step="any"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
                className="h-10 rounded-xl text-center font-mono font-black"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                سعر التكلفة (ج.م)
              </Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="h-10 rounded-xl text-center font-mono font-bold"
              />
            </div>
          </div>

          {/* Batch & Expiry (if applicable) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                رقم التشغيلة / الوجبة
              </Label>
              <Input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="اختياري (تلقائي)"
                className="h-10 rounded-xl text-xs font-mono text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                تاريخ الصلاحية
              </Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-10 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black h-10 px-5 gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ الرصيد'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
