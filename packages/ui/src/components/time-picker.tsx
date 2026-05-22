'use client';

import { Clock } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

type TimePickerProps = {
  /** Stringa "HH:mm" o "HH:mm:ss". Default ora corrente. */
  value: string;
  onChange: (value: string) => void;
  /** Step in minuti per il select dei minuti. Default 5. */
  minuteStep?: 1 | 5 | 10 | 15 | 30;
  /** Range orario consentito ("HH:mm" inclusivi). Default 00:00 – 23:55. */
  minHour?: number;
  maxHour?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
};

/**
 * TimePicker — 2 Select (ore + minuti) con clock icon prefix.
 *
 * shadcn non ha una TimePicker primitive ufficiale; il pattern raccomandato
 * dalla community è 2 Select per controllo totale di styling/UX (vs
 * <input type="time"> nativo che varia per browser).
 *
 * Usage:
 *   <TimePicker value="13:00" onChange={setTime} />
 */
export function TimePicker({
  value,
  onChange,
  minuteStep = 5,
  minHour = 0,
  maxHour = 23,
  disabled,
  className,
  id,
}: TimePickerProps) {
  const [hours, minutes] = React.useMemo(() => parseTime(value), [value]);

  const hourOptions = React.useMemo(() => {
    const arr: string[] = [];
    for (let h = minHour; h <= maxHour; h += 1) arr.push(String(h).padStart(2, '0'));
    return arr;
  }, [minHour, maxHour]);

  const minuteOptions = React.useMemo(() => {
    const arr: string[] = [];
    for (let m = 0; m < 60; m += minuteStep) arr.push(String(m).padStart(2, '0'));
    return arr;
  }, [minuteStep]);

  // Round current minutes to nearest step option for display
  const roundedMinutes = React.useMemo(() => {
    const m = parseInt(minutes, 10);
    if (Number.isNaN(m)) return minuteOptions[0] ?? '00';
    const rounded = Math.round(m / minuteStep) * minuteStep;
    return String(Math.min(Math.max(0, rounded), 59)).padStart(2, '0');
  }, [minutes, minuteStep, minuteOptions]);

  const handleHourChange = (h: string | null) => {
    if (h) onChange(`${h}:${roundedMinutes}`);
  };
  const handleMinuteChange = (m: string | null) => {
    if (m) onChange(`${hours}:${m}`);
  };

  return (
    <div
      id={id}
      className={cn(
        'inline-flex h-12 items-center gap-0 rounded-md border border-input bg-card px-3',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <Select value={hours} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger
          className="h-10 w-auto min-w-[3rem] border-none bg-transparent px-2 text-base font-medium shadow-none focus:ring-0 [&_svg]:hidden"
          aria-label="Ore"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h} className="justify-center font-mono">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-base font-medium text-muted-foreground" aria-hidden>
        :
      </span>
      <Select value={roundedMinutes} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger
          className="h-10 w-auto min-w-[3rem] border-none bg-transparent px-2 text-base font-medium shadow-none focus:ring-0 [&_svg]:hidden"
          aria-label="Minuti"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m} className="justify-center font-mono">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function parseTime(value: string): [string, string] {
  const m = /^(\d{1,2}):(\d{1,2})/.exec(value);
  if (!m) return ['00', '00'];
  const h = String(parseInt(m[1] ?? '0', 10)).padStart(2, '0');
  const min = String(parseInt(m[2] ?? '0', 10)).padStart(2, '0');
  return [h, min];
}
