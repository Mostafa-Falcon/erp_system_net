'use client';

import React, { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/core/state/useSessionStore';
import { db } from '@/core/db/app_database';
import { formatNumber } from '@/lib/format';
import type { Product, Warehouse, StockLevel } from '@/types';
import { ArrowRightToLine, Search, Save, CheckCircle2, AlertCircle, Box } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function OpeningBalanceContent() {
  const { currentUser, activeBranchId } = useSessionStore();
  const orgId = currentUser?.org_id || '';
  const branchId = activeBranchId || currentUser?.branch_id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Editable rows state: productId -> { quantity, cost }
  const [editValues, setEditValues] = useState<Record<string, { qty: string; cost: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadData = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const [prods, whs, stocks] = await Promise.all([
        db.products.where('org_id').equals(orgId).toArray(),
        db.warehouses.where('org_id').equals(orgId).toArray(),
        db.stock_levels.toArray(),
      ]);
      setProducts(prods);
      setWarehouses(whs);
      setStockLevels(stocks);

      const targetWh = selectedWarehouseId || whs[0]?.id || '';
      if (!selectedWarehouseId && whs.length > 0) {
        setSelectedWarehouseId(whs[0].id);
      }

      // Initialize edit values
      const initial: Record<string, { qty: string; cost: string }> = {};
      for (const p of prods) {
        const sl = stocks.find((s) => s.product_id === p.id && s.warehouse_id === targetWh);
        initial[p.id] = {
          qty: sl ? sl.quantity.toString() : '0',
          cost: (p.cost_price || 0).toString(),
        };
      }
      setEditValues(initial);
    } catch (err) {
      console.error('Error loading opening balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, branchId]);

  const handleWarehouseChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    const initial: Record<string, { qty: string; cost: string }> = {};
    for (const p of products) {
      const sl = stockLevels.find((s) => s.product_id === p.id && s.warehouse_id === whId);
      initial[p.id] = {
        qty: sl ? sl.quantity.toString() : '0',
        cost: (p.cost_price || 0).toString(),
      };
    }
    setEditValues(initial);
  };

  const handleRowChange = (prodId: string, field: 'qty' | 'cost', value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedWarehouseId) return;
    try {
      setIsSaving(true);
      setSavedSuccess(false);
      const now = new Date().toISOString();

      await db.transaction('rw', [db.stock_levels, db.products, db.inventory_transactions], async () => {
        for (const [prodId, val] of Object.entries(editValues)) {
          const qty = parseFloat(val.qty) || 0;
          const cost = parseFloat(val.cost) || 0;

          // Update cost price on product if changed
          const prod = products.find((p) => p.id === prodId);
          if (prod && prod.cost_price !== cost) {
            await db.products.update(prodId, { cost_price: cost, updated_at: now });
          }

          // Update stock level
          const existingLevel = await db.stock_levels
            .where('product_id')
            .equals(prodId)
            .and((s) => s.warehouse_id === selectedWarehouseId)
            .first();

          if (existingLevel) {
            if (existingLevel.quantity !== qty) {
              await db.stock_levels.update(existingLevel.id, {
                quantity: qty,
                updated_at: now,
              });
              // Log opening balance change
              await db.inventory_transactions.add({
                id: uuidv4(),
                org_id: orgId,
                warehouse_id: selectedWarehouseId,
                product_id: prodId,
                transaction_type: 'opening_balance',
                quantity: qty - existingLevel.quantity,
                unit_id: 'default_unit',
                unit_conversion_factor: 1,
                base_quantity: qty - existingLevel.quantity,
                unit_cost: cost,
                total_cost: cost * (qty - existingLevel.quantity),
                balance_after: qty,
                notes: 'تسجيل / تعديل رصيد أول المدة',
                created_by: currentUser?.id || '',
                created_at: now,
                sync_status: 'pending',
              });
            }
          } else if (qty > 0) {
            await db.stock_levels.add({
              id: uuidv4(),
              org_id: orgId,
              product_id: prodId,
              warehouse_id: selectedWarehouseId,
              quantity: qty,
              reserved_quantity: 0,
              available_quantity: qty,
              updated_at: now,
            });
            await db.inventory_transactions.add({
              id: uuidv4(),
              org_id: orgId,
              warehouse_id: selectedWarehouseId,
              product_id: prodId,
              transaction_type: 'opening_balance',
              quantity: qty,
              unit_id: 'default_unit',
              unit_conversion_factor: 1,
              base_quantity: qty,
              unit_cost: cost,
              total_cost: cost * qty,
              balance_after: qty,
              notes: 'تسجيل رصيد أول المدة الافتتاحي',
              created_by: currentUser?.id || '',
              created_at: now,
              sync_status: 'pending',
            });
          }
        }
      });

      setSavedSuccess(true);
      await loadData();
    } catch (err) {
      console.error('Error saving opening balance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#2563eb]">
            <ArrowRightToLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">أرصدة أول المدة للأصناف</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              إدخال وتثبيت الأرصدة الافتتاحية وتكلفة البضاعة لبدء الدورة المخزنية والمحاسبية
            </p>
          </div>
        </div>

        <Button
          disabled={isSaving}
          onClick={handleSaveAll}
          className="bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs h-10 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ وتثبيت الأرصدة'}
        </Button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          تم حفظ وتحديث أرصدة أول المدة بنجاح لكافة الأصناف
        </div>
      )}

      {/* Warehouse & Search Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="w-full sm:w-64">
          <select
            value={selectedWarehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم الصنف أو الباركود لتعديل رصيده..."
            className="pr-9 h-10 text-xs font-bold rounded-lg border-slate-200"
          />
        </div>
      </div>

      {/* Grid / Table of Items */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500">
                <th className="py-3.5 px-4">الصنف</th>
                <th className="py-3.5 px-4">الباركود / الكود</th>
                <th className="py-3.5 px-4 w-40">رصيد أول المدة</th>
                <th className="py-3.5 px-4 w-40">سعر التكلفة (ج.م)</th>
                <th className="py-3.5 px-4">إجمالي القيمة الافتتاحية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    جاري تحميل الأصناف...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    لا توجد أصناف مطابقة
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const val = editValues[p.id] || { qty: '0', cost: '0' };
                  const total = (parseFloat(val.qty) || 0) * (parseFloat(val.cost) || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{p.sku}</td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={val.qty}
                          onChange={(e) => handleRowChange(p.id, 'qty', e.target.value)}
                          className="h-8 text-xs font-black rounded-lg w-32 bg-slate-50 dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={val.cost}
                          onChange={(e) => handleRowChange(p.id, 'cost', e.target.value)}
                          className="h-8 text-xs font-black rounded-lg w-32 bg-slate-50 dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-3 px-4 font-black text-[#2563eb]">
                        {formatNumber(total)} ج.م
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OpeningBalancePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs font-bold">جاري تحميل أرصدة أول المدة...</div>}>
        <OpeningBalanceContent />
      </Suspense>
    </AppShell>
  );
}
