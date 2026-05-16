'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  id?: string;
  /**
   * Locale per il display nel trigger button — default italiano.
   */
  locale?: typeof it;
  /**
   * Format pattern per il display — default "EEEE d MMMM yyyy" es. "venerdì 16 maggio 2026".
   */
  formatPattern?: string;
};

/**
 * DatePicker — Calendar + Popover + Button trigger (port shadcn standard).
 * Locale italiano di default, formato date "EEEE d MMMM yyyy".
 *
 * Usage:
 *   <DatePicker value={date} onChange={setDate} minDate={new Date()} />
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Scegli una data',
  disabled,
  minDate,
  maxDate,
  className,
  id,
  locale = it,
  formatPattern = 'EEEE d MMMM yyyy',
}: DatePickerProps) {
  const computedDisabled = React.useCallback(
    (d: Date): boolean => {
      if (disabled?.(d)) return true;
      if (minDate && d < startOfDay(minDate)) return true;
      if (maxDate && d > endOfDay(maxDate)) return true;
      return false;
    },
    [disabled, minDate, maxDate],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'h-12 w-full justify-start px-4 text-left text-base font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {value ? (
            <span className="capitalize">{format(value, formatPattern, { locale })}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={computedDisabled}
          locale={locale}
          weekStartsOn={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}
