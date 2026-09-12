'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ContactForm } from '@/components/contacts/ContactForm';
import { useSessionStore } from '@/core/state/useSessionStore';
import { ContactsRepository } from '@/modules/contacts/contacts_repository';
import type { Contact, ContactType } from '@/types';

function NewContactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetType = (searchParams.get('type') as ContactType | null) ?? null;
  const editId = searchParams.get('edit');
  const { currentUser } = useSessionStore();
  const orgId = currentUser?.org_id || '';

  const [initial, setInitial] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId || !orgId) return;
    const load = async () => {
      try {
        const c = await ContactsRepository.getById(editId);
        if (c && c.org_id === orgId) setInitial(c);
      } catch (err) {
        console.error('Load contact edit error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    Promise.resolve().then(load);
  }, [editId, orgId]);

  const onSaved = (contact: Contact) => {
    const target = contact.type === 'supplier' ? '/contacts/suppliers' : '/contacts/customers';
    router.push(target);
  };

  if (!currentUser) return null;

  return (
    <AppShell
      title={initial ? 'تعديل جهة تعامل' : 'جهة تعامل جديدة'}
      subtitle={
        initial
          ? 'عدّل بيانات الجهة — الرصيد والحساب يتغيران فقط عبر الفواتير والسندات'
          : 'أدخل بيانات الجهة وحدد نوعها: عميل (له فواتير بيع) أو مورد (له فواتير شراء) أو عميل ومورد معاً'
      }
    >
      {isLoading ? (
        <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 py-16 text-center text-slate-400 text-xs font-semibold">
          جاري التحميل...
        </div>
      ) : (
        <ContactForm
          orgId={orgId}
          initial={initial}
          presetType={presetType}
          onSaved={onSaved}
        />
      )}
    </AppShell>
  );
}

export default function NewContactPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f4f6f8]">
          <div className="w-9 h-9 border-3 border-[#558b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewContactContent />
    </Suspense>
  );
}