import * as React from 'react';

import { cn } from '@/lib/utils';

import { Input } from './input';
import { Label } from './label';

/**
 * <Field> — wrapper sopra Input shadcn col pattern Desko:
 * label statica sopra, optional/required indicators, helper text inline.
 *
 *   <Field id="email" label="Email" required defaultValue="..." />
 *   <Field id="note" label="Note" optional helperText="Max 280 caratteri" />
 */

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  label: string;
  helperText?: React.ReactNode;
  hint?: React.ReactNode;
  errorText?: string;
  required?: boolean;
  optional?: boolean;
  fullWidth?: boolean;
  containerClassName?: string;
};

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  (
    {
      id,
      label,
      helperText,
      hint,
      errorText,
      required,
      optional,
      fullWidth = true,
      containerClassName,
      className,
      ...inputProps
    },
    ref,
  ) => {
    const helperId = id ? `${id}-helper` : undefined;
    const hasError = !!errorText;

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-flex flex-col', containerClassName)}>
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

        <Input
          id={id}
          ref={ref}
          aria-describedby={helperId}
          aria-invalid={hasError || undefined}
          className={className}
          {...inputProps}
        />

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
Field.displayName = 'Field';
