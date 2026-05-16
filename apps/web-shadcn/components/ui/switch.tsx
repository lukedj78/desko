'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Switch toggle minimale (no radix dep). Port di MUI Switch.
 * Usage:
 *   <Switch checked={value} onChange={() => setValue(!value)} />
 */
type SwitchProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-card shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  ),
);
Switch.displayName = 'Switch';
