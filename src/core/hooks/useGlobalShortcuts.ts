'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * 🦅 Falcon ERP - Global Unified Keyboard Shortcuts
 * Ensures lightning-fast, keyboard-driven navigation across the whole system:
 * - [F1]: نقطة البيع السريعة (POS)
 * - [F2]: فاتورة شراء وتوريد جديدة
 * - [F3]: إضافة صنف جديد
 * - [F4] / [Ctrl+K]: البحث الشامل السريع
 * - [Ctrl+S]: حفظ العملية الحالية
 * - [Esc]: إلغاء / إغلاق
 */
export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. [Ctrl + K] or [F4] -> Quick Global Search
      if ((e.ctrlKey && (e.key === 'k' || e.key === 'K')) || e.key === 'F4') {
        e.preventDefault();
        const searchInput = document.getElementById('sidebar-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          toast.info('تم تفعيل البحث السريع (Ctrl + K)');
        }
        return;
      }

      // 2. [Ctrl + S] -> Save current action / form submit
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        
        // Dispatch custom event for page-specific handling
        window.dispatchEvent(new CustomEvent('erp:save'));

        // Attempt to click the primary submit button if present
        const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          toast.success('تم تنفيذ أمر الحفظ (Ctrl + S)');
        } else {
          toast.info('اختصار الحفظ (Ctrl + S)');
        }
        return;
      }

      // 3. Ignore single function keys if currently typing in an input or textarea
      // (Unless it's explicitly F1, F2, F3 which are global functional accelerators)
      if (e.key === 'F1') {
        e.preventDefault();
        router.push('/sales/pos');
        toast.info('جاري فتح نقطة البيع (F1)...');
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        router.push('/purchases/invoices/new');
        toast.info('جاري فتح فاتورة شراء جديدة (F2)...');
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        router.push('/items/new');
        toast.info('جاري فتح إضافة صنف جديد (F3)...');
        return;
      }

      // 4. [Esc] -> Blur active element or cancel
      if (e.key === 'Escape') {
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          active.blur();
        }
        window.dispatchEvent(new CustomEvent('erp:escape'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);
}
