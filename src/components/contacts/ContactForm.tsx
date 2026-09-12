'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactsRepository } from '@/modules/contacts/contacts_repository';
import type { Contact, ContactType } from '@/types';

const inputCls =
  'h-10 w-full px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const selectCls =
  'h-10 w-full px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#558b2f]';

const TYPE_LABELS: Record<ContactType, string> = {
  customer: 'عميل',
  supplier: 'مورد',
  both: 'عميل ومورد',
};

interface ContactFormProps {
  orgId: string;
  initial?: Contact | null;
  presetType?: ContactType | null;
  onSaved: (contact: Contact) => void;
}

export function ContactForm({ orgId, initial, presetType, onSaved }: ContactFormProps) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<ContactType>(initial?.type ?? presetType ?? 'customer');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [mobile, setMobile] = useState(initial?.mobile ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [taxNumber, setTaxNumber] = useState(initial?.tax_number ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [creditLimit, setCreditLimit] = useState(String(initial?.credit_limit ?? 0));
  const [openingBalance, setOpeningBalance] = useState('0');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setError('');
    if (!name.trim()) {
      setError('اسم الجهة مطلوب.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && initial) {
        const updated = await ContactsRepository.updateContact(initial.id, {
          name: name.trim(),
          type,
          phone: phone.trim() || undefined,
          mobile: mobile.trim() || undefined,
          email: email.trim() || undefined,
          tax_number: taxNumber.trim() || undefined,
          address: address.trim() || undefined,
          credit_limit: Number(creditLimit) || 0,
          notes: notes.trim() || undefined,
        });
        if (!updated) throw new Error('تعذر تحديث الجهة.');
        onSaved(updated);
      } else {
        const created = await ContactsRepository.createContact(
          {
            org_id: orgId,
            name: name.trim(),
            type,
            phone: phone.trim() || undefined,
            mobile: mobile.trim() || undefined,
            email: email.trim() || undefined,
            tax_number: taxNumber.trim() || undefined,
            address: address.trim() || undefined,
            credit_limit: Number(creditLimit) || 0,
            is_active: true,
            notes: notes.trim() || undefined,
          },
          Number(openingBalance) || 0
        );
        onSaved(created);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {isEdit ? 'تعديل جهة تعامل' : 'جهة تعامل جديدة'}
        </h3>
        {isEdit && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
            {TYPE_LABELS[type]} • {TYPE_LABELS[initial?.type ?? type]}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-bold text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الجهة *</span>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="الاسم التجاري أو الشخصي" />
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الجهة *</span>
          <select value={type} onChange={(e) => setType(e.target.value as ContactType)} className={selectCls}>
            <option value="customer">عميل</option>
            <option value="supplier">مورد</option>
            <option value="both">عميل ومورد</option>
          </select>
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">هاتف أرضي</span>
          <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="02-..." />
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">موبايل</span>
          <Input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputCls} placeholder="01..." dir="ltr" />
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} dir="ltr" />
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم الضريبي</span>
          <Input type="text" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className={inputCls} dir="ltr" />
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">حد الائتمان</span>
          <Input type="number" min={0} step="any" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className={inputCls} />
        </div>
        {!isEdit && (
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رصيد افتتاحي</span>
            <Input type="number" step="any" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} className={inputCls} />
            <span className="block text-[10px] text-slate-400 mt-0.5">موجب = على الجهة (مدين) • سالب = للجهة (دائن)</span>
          </div>
        )}
        <div className="lg:col-span-2">
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان</span>
          <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</span>
          <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          onClick={save}
          disabled={isSaving}
          className="h-10 px-6 bg-[#558b2f] hover:bg-[#436d25] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          {isSaving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'حفظ الجهة'}
        </Button>
      </div>
    </div>
  );
}