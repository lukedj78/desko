'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { cn } from '@desko/ui/lib/utils';
import { Label } from '@desko/ui/components/label';

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  helperText?: React.ReactNode;
  hint?: React.ReactNode;
  errorText?: string;
  required?: boolean;
  optional?: boolean;
};

/**
 * PasswordField — input password con toggle eye + pattern Field statico Desko.
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    { id, label, helperText, hint, errorText, required, optional, className, ...inputProps },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);
    const helperId = id ? `${id}-helper` : undefined;
    const hasError = !!errorText;

    return (
      <div className="w-full">
        <Label
          htmlFor={id}
          className={cn(
            'mb-2 flex items-baseline gap-2',
            hasError ? 'text-destructive' : 'text-foreground',
          )}
        >
          <span>{label}</span>
          {required ? <span className="text-destructive">*</span> : null}
          {optional ? (
            <span className="text-xs font-normal text-muted-foreground">facoltativo</span>
          ) : null}
          {hint ? (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{hint}</span>
          ) : null}
        </Label>

        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={visible ? 'text' : 'password'}
            aria-describedby={helperId}
            aria-invalid={hasError || undefined}
            className={cn(
              'flex h-12 w-full rounded-md border border-input bg-card pl-4 pr-12 py-2 text-base font-sans transition-colors',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary',
              'hover:border-foreground/40',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
              'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
              className,
            )}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Nascondi password' : 'Mostra password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {helperText || errorText ? (
          <p
            id={helperId}
            className={cn(
              'mt-2 text-xs leading-snug',
              hasError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {errorText ?? helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
PasswordField.displayName = 'PasswordField';
