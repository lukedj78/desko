import * as React from 'react';

import { cn } from '../lib/utils';

/**
 * Eyebrow — sopra-titolo monospace usato in tutta l'app (port da MUI Eyebrow).
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
