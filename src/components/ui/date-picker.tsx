'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
  date?: Date | string | null;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = 'اختر التاريخ...',
  className,
  align = 'center',
  disabled = false,
  trigger,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return date;
  }, [date]);

  const formattedLabel = React.useMemo(() => {
    if (!selectedDate) return placeholder;
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-10 justify-between text-right font-normal rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs',
              !selectedDate && 'text-slate-400',
              className
            )}
          >
            <span className="font-mono font-bold">{formattedLabel}</span>
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800" align={align}>
        <Calendar
          selected={selectedDate}
          onSelect={(newDate) => {
            onSelect(newDate);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
