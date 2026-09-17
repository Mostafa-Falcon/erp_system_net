'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/Icons';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useSessionStore } from '@/core/state/useSessionStore';
import { InventoryRepository } from '@/modules/inventory/inventory_repository';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { formatNumber } from '@/lib/format';
import type { Product, Warehouse, StocktakeItem } from '@/types';
import { toast } from 'sonner';

type CountItem = {
  product: Product;
  expected_quantity: number;
  actual_quantity: number;
  difference: number;
  unit_cost: number;
  diff_value: number;
};

export default function NewStocktakePage() {
  const router = useRouter();
  const { currentUser, activeBranchId } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CountItem[]>([]);
  const [notes, setOsNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      try {
        const [whs, prods] = await Promise.all([
          InventoryRepository.getWarehouses(orgId),
          ProductRepository.getAll(orgId),
        ]);
        setWarehouses(whs);
        setAllProducts(prods.filter(p => p.item_type === 'storable'));
        if (whs.length > 0) setSelectedWarehouse(whs[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [orgId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, allProducts]);

  const addItem = async (p: Product) => {
    if (items.some(it => it.product.id === p.id)) {
      toast.error('الصنف مضاف بالفعل.');
      return;
    }

    const { db } = await import('@/core/db/app_database');
    const level = await db.stock_levels.get(`${selectedWarehouse}_${p.id}`);
    const expected = level?.quantity || 0;

    const newItem: CountItem = {
      product: p,
      expected_quantity: expected,
      actual_quantity: expected,
      difference: 0,
      unit_cost: p.purchase_price,
      diff_value: 0,
    };

    setItems([newItem, ...items]);
    setSearchQuery('');
  };

  const updateQty = (pid: string, val: string) => {
    const qty = Number(val) || 0;
    setItems(items.map(it => {
      if (it.product.id !== pid) return it;
      const diff = qty - it.expected_quantity;
      return {
        ...it,
        actual_quantity: qty,
        difference: diff,
        diff_value: diff * it.unit_cost,
      };
    }));
  };

  const removeItem = (pid: string) => {
    setItems(items.filter(it => it.product.id !== pid));
  };

  const totalDiffValue = items.reduce((acc, it) => acc + it.diff_value, 0);

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!selectedWarehouse || items.length === 0) {
      toast.error('يرجى اختيار المخزن وإضافة أصناف للجرد.');
      return;
    }

    setIsSaving(true);
    try {
      const session = await InventoryRepository.createStocktakeSession({
        orgId,
        branchId: activeBranchId || currentUser!.branch_id!,
        warehouseId: selectedWarehouse,
        userId: currentUser!.id,
        notes,
      });

      const stocktakeItems: Omit<StocktakeItem, 'id' | 'session_id'>[] = items.map(it => ({
        product_id: it.product.id,
        batch_id: null,
        expected_quantity: it.expected_quantity,
        actual_quantity: it.actual_quantity,
        difference_quantity: it.difference,
        unit_cost: it.unit_cost,
        difference_value: it.diff_value,
      }));

      await InventoryRepository.updateStocktakeItems(session.id, stocktakeItems);

      if (status === 'completed') {
        const res = await InventoryRepository.commitStocktakeSession(session.id, currentUser!.id);
        if (!res.success) throw new Error(res.error);
        toast.success('تم اعتماد الجرد وتحديث المخزون بنجاح.');
      } else {
        toast.success('تم حفظ مسودة الجرد بنجاح.');
      }

      router.push('/inventory/adjustments');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      title="ورقة جرد جديدة"
      subtitle="تسجيل المقارنة الفعلية مع الرصيد الدفتري واحتساب الفروق تلقائياً"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isSaving || items.length === 0}
            className="h-10 px-4 text-xs font-black rounded-xl flex items-center gap-2"
          >
            <Icons.Save className="w-4 h-4" /> حفظ مسودة
          </Button>
          <Button
            onClick={() => handleSave('completed')}
            disabled={isSaving || items.length === 0}
            className="h-10 px-6 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2"
          >
            <Icons.Check className="w-4 h-4" /> اعتماد وتسوية الجرد
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Section */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">البحث وإضافة أصناف للجرد</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
              <Icons.Warehouse className="w-3.5 h-3.5" />
              <span>المخزن المستهدف:</span>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-slate-50 border-none text-[#558b2f] focus:ring-0 cursor-pointer font-black"
                disabled={items.length > 0}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search className="w-5 h-5" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اكتب اسم الصنف أو الباركود لإضافته لورقة الجرد..."
              className="h-14 pr-12 pl-4 text-sm font-bold rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-[#558b2f] transition-all shadow-inner"
            />

            {searchResults.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right border-b last:border-none border-slate-50 dark:border-slate-700 group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#558b2f]">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    </div>
                    <Icons.Plus className="w-4 h-4 text-[#558b2f] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Count Table */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">الأصناف المجرودة ({items.length} صنف)</h3>
            <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black">جلسة جرد نشطة</Badge>
          </div>

          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-sm">
                <TableRow>
                  <TableHead className="text-[11px] font-black uppercase">الصنف</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-center">الرصيد الدفتري</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-center">الكمية الفعلية</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-center">الفرق</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-left">قيمة الفرق</TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-center w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs font-bold">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <Icons.Inbox className="w-12 h-12 opacity-10" />
                        <span>لم يتم إضافة أصناف للجرد بعد. ابحث عن صنف لإضافته ودرجه.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(it => (
                    <TableRow key={it.product.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white">{it.product.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{it.product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-slate-500 font-mono text-sm">{formatNumber(it.expected_quantity)}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={it.actual_quantity}
                          onChange={(e) => updateQty(it.product.id, e.target.value)}
                          className="h-9 w-24 mx-auto text-center font-black bg-white dark:bg-slate-950 border-[#2563eb]/20 focus:border-[#2563eb]"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "font-black text-[11px]",
                          it.difference === 0 ? "bg-slate-100 text-slate-500" : it.difference > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {it.difference > 0 ? '+' : ''}{it.difference}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-left font-black text-sm", it.diff_value >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {formatNumber(it.diff_value)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(it.product.id)}
                          className="text-slate-300 hover:text-red-600 rounded-full"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {items.length > 0 && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase">إجمالي فروقات الكمية</span>
                  <span className="text-sm font-black text-slate-900">{items.reduce((acc, it) => acc + it.difference, 0)} قطعة</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase">إجمالي قيمة الفروق</span>
                  <span className={cn("text-lg font-black", totalDiffValue >= 0 ? "text-[#558b2f]" : "text-red-600")}>
                    {formatNumber(totalDiffValue)} ج.م
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">ملاحظات جلسة الجرد</h3>
          <Textarea
            value={notes}
            onChange={(e) => setOsNotes(e.target.value)}
            placeholder="أي ملاحظات تفصيلية عن حالة الأصناف أو سبب الفروق..."
            className="w-full min-h-[100px] rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 p-4 font-bold text-xs"
          />
        </div>
      </div>
    </AppShell>
  );
}
