'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/core/state/useSessionStore';
import { ProductRepository } from '@/modules/inventory/product_repository';
import { renderCode128Svg } from '@/lib/code128';
import { formatNumber } from '@/lib/format';
import { Icons } from '@/components/ui/Icons';
import type { Product, Unit } from '@/types';

export default function BarcodePrintPage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [unitsById, setUnitsById] = useState<Record<string, Unit>>({});
  const [orgName, setOrgName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customCopies, setCustomCopies] = useState('2');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (!orgId) return;
    let mounted = true;

    const load = async () => {
      try {
        const { db } = await import('@/core/db/app_database');
        const [prods, unts, org] = await Promise.all([
          ProductRepository.getAll(orgId),
          ProductRepository.getAllUnits(orgId),
          db.organizations.get(orgId),
        ]);
        if (!mounted) return;
        setProducts(prods.filter((p) => p.item_type === 'storable'));
        const umap: Record<string, Unit> = {};
        for (const u of unts) umap[u.id] = u;
        setUnitsById(umap);
        setOrgName(org?.name || currentUser?.full_name || '');
        setSelected(new Set(prods.map((p) => p.id)));
      } catch (err) {
        console.error('Load barcode page error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentUser, orgId, router]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const selectedProducts = products.filter((p) => selected.has(p.id));
  const customLabels: { code: string }[] =
    customCode.trim()
      ? Array.from({ length: Math.max(1, Number(customCopies) || 1) }).map(() => ({ code: customCode.trim() }))
      : [];

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (filtered.every((p) => next.has(p.id))) {
        filtered.forEach((p) => next.delete(p.id));
      } else {
        filtered.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
        <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <style>{`
        @media print {
          .screen-only { display: none !important; }
          body { background: #fff !important; }
          .print-area { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Screen toolbar (hidden on print) */}
      <div className="screen-only sticky top-0 z-30 bg-white dark:bg-[#131b2e] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="رجوع"
          >
            <Icons.ArrowRight />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">طباعة الباركود</h1>
            <p className="text-[11px] font-semibold text-slate-400">توليد ملصقات Code 128 وطباعتها على أجهزة الليزر/الحرارية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="h-10 px-5 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Icons.Print /> طباعة ({selectedProducts.length + customLabels.length} ملصق)
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-5">
        {/* Selection panel */}
        <div className="screen-only bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="flex-1">
              <span className="block text-[11px] font-bold text-slate-400 mb-1">بحث في الأصناف</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اسم الصنف أو الكود..."
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#558b2f]"
              />
            </div>
            <div className="flex flex-row gap-3">
              <div className="w-40">
                <span className="block text-[11px] font-bold text-slate-400 mb-1">كود مخصص</span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="مثال BARC123"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#558b2f]"
                />
              </div>
              <div className="w-20">
                <span className="block text-[11px] font-bold text-slate-400 mb-1">نسخ</span>
                <input
                  type="number"
                  min={1}
                  value={customCopies}
                  onChange={(e) => setCustomCopies(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#558b2f]"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <input type="checkbox" checked={selectedProducts.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-[#558b2f] w-4 h-4" />
              تحديد الكل
            </label>
          </div>

          {/* Quick product ticker */}
          <div className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  });
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  selected.has(p.id)
                    ? 'bg-[#558b2f] text-white border-[#558b2f]'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {p.name}
              </button>
            ))}
            {filtered.length === 0 && <span className="text-[11px] text-slate-400">لا توجد نتائج.</span>}
          </div>
        </div>

        {/* Printable labels area */}
        <div className="print-area bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">{orgName}</div>
              <div className="text-[10px] text-slate-400">ملصقات الأصناف — Code 128</div>
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 print:grid-cols-4">
            {selectedProducts.map((p) => (
              <div key={p.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center text-center bg-slate-50 dark:bg-slate-900" style={{ breakInside: 'avoid' }}>
                <div className="font-black text-xs text-slate-900 dark:text-white mb-1 line-clamp-2 min-h-8">
                  {p.name}
                </div>
                <div className="text-[10px] font-bold text-[#558b2f] mb-1.5">
                  {formatNumber(p.sale_price)} — {unitsById[p.base_unit_id]?.symbol || ''}
                </div>
                <div
                  className="text-slate-800"
                  dangerouslySetInnerHTML={{ __html: renderCode128Svg(p.sku, { moduleWidth: 0.3, height: 30 }) }}
                />
                <div className="mt-1 font-mono text-[9px] text-slate-500 tracking-wider">{p.sku}</div>
              </div>
            ))}

            {customLabels.map((lbl, i) => (
              <div key={`custom-${i}`} className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center text-center bg-slate-50 dark:bg-slate-900" style={{ breakInside: 'avoid' }}>
                <div className="font-black text-xs text-slate-900 dark:text-white mb-1.5">كود مخصص</div>
                <div className="text-slate-800" dangerouslySetInnerHTML={{ __html: renderCode128Svg(lbl.code, { moduleWidth: 0.3, height: 30 }) }} />
                <div className="mt-1 font-mono text-[9px] text-slate-500 tracking-wider">{lbl.code}</div>
              </div>
            ))}

            {selectedProducts.length === 0 && customLabels.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs font-semibold">
                اختر أصنافاً من الأعلى أو أدخل كوداً مخصصاً لبدء إنشاء الملصقات.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}