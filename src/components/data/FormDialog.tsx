'use client';

import React, { useCallback, useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'switch';
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number | boolean;
  fullWidth?: boolean;
  dir?: 'ltr' | 'rtl';
  step?: string;
}

export type FormValues = Record<string, string | number | boolean>;

interface FormDialogProps {
  title: string;
  subtitle?: string;
  triggerLabel?: string;
  triggerExtra?: React.ReactNode;
  fields: FormField[];
  submitLabel?: string;
  onSubmit: (values: FormValues) => Promise<void>;
}

/** Generic "create entity" modal form with validation, busy state and data refresh event. */
export const FormDialog = ({
  title,
  subtitle,
  triggerLabel = 'إضافة',
  triggerExtra,
  fields,
  submitLabel = 'حفظ',
  onSubmit,
}: FormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(() =>
    fields.reduce<FormValues>((acc, f) => {
      if (f.defaultValue !== undefined) acc[f.name] = f.defaultValue;
      if (f.type === 'switch') acc[f.name] = Boolean(f.defaultValue ?? false);
      return acc;
    }, {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setValue = (name: string, value: string | number | boolean) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = useCallback(async () => {
    const nextErrors: Record<string, string> = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (f.required && (raw === undefined || raw === '' || raw === null)) {
        nextErrors[f.name] = 'هذا الحقل مطلوب.';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(values);
      setOpen(false);
      setValues(fields.reduce<FormValues>((acc, f) => {
        if (f.defaultValue !== undefined) acc[f.name] = f.defaultValue;
        if (f.type === 'switch') acc[f.name] = Boolean(f.defaultValue ?? false);
        return acc;
      }, {}));
      window.dispatchEvent(new Event('falcon_data_changed'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'تعذّر الحفظ. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, values, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      {triggerExtra}
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        <div dir="rtl" className="grid gap-4 py-2">
          {fields.map((f) => {
            const isError = Boolean(errors[f.name]);
            return (
              <div key={f.name} className={f.fullWidth ? 'col-span-full' : 'sm:col-span-1'}>
                <Label htmlFor={f.name} className="text-xs font-bold mb-1.5 block">
                  {f.label}
                  {f.required && <span className="text-rose-500"> *</span>}
                </Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    id={f.name}
                    dir={f.dir}
                    value={(values[f.name] as string) ?? ''}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    className="bg-slate-50 dark:bg-[#090e1a] rounded-xl h-20"
                  />
                ) : f.type === 'select' ? (
                  <Select
                    value={(values[f.name] as string) ?? undefined}
                    onValueChange={(v) => setValue(f.name, v)}
                  >
                    <SelectTrigger dir="rtl" className="bg-slate-50 dark:bg-[#090e1a] rounded-xl h-10">
                      <SelectValue placeholder={f.placeholder || 'اختر...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'switch' ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 h-10">
                    <span className="text-xs font-semibold text-slate-500">{f.hint}</span>
                    <Switch
                      checked={Boolean(values[f.name])}
                      onCheckedChange={(v) => setValue(f.name, v)}
                    />
                  </div>
                ) : f.type === 'number' ? (
                  <Input
                    id={f.name}
                    type="number"
                    dir="ltr"
                    step={f.step}
                    value={(values[f.name] as string | undefined) ?? ''}
                    onChange={(e) => setValue(f.name, e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={f.placeholder}
                    className="bg-slate-50 dark:bg-[#090e1a] rounded-xl h-10 text-left font-semibold"
                  />
                ) : (
                  <Input
                    id={f.name}
                    dir={f.dir ?? 'rtl'}
                    value={(values[f.name] as string) ?? ''}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    className="bg-slate-50 dark:bg-[#090e1a] rounded-xl h-10"
                  />
                )}
                {isError && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors[f.name]}</p>}
              </div>
            );
          })}
        </div>

        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
              إلغاء
            </Button>
          </DialogTrigger>
          <Button
            onClick={handleSubmit}
            className="gap-2 rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;