import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Pattern Desko: altezza 48px (match button "large") = match MUI Field.
          'flex h-12 w-full rounded-md border border-input bg-card px-4 py-2 text-base font-sans transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary',
          'hover:border-foreground/40',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
