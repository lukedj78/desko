import { FLOOR_META, type Floor } from '@desko/domain';

import { cn } from '@/lib/utils';

/**
 * Chip che mostra il piano di lavoro (US-7). Due valori: 7° / 2°.
 * Su `null` mostra "Piano non indicato" tenue.
 */
export function FloorBadge({
  floor,
  variant = 'soft',
  showFull,
  className,
}: {
  floor: Floor | null;
  variant?: 'soft' | 'outline' | 'solid';
  showFull?: boolean;
  className?: string;
}) {
  if (floor === null) {
    return (
      <span
        className={cn(
          'inline-flex h-5 items-center rounded-md border border-dashed border-border px-2 text-[11px] font-medium text-muted-foreground',
          className,
        )}
      >
        Piano non indicato
      </span>
    );
  }

  const meta = FLOOR_META[floor];
  const label = showFull ? meta.label : meta.shortLabel;

  if (variant === 'outline') {
    return (
      <span
        className={cn(
          'inline-flex h-5 items-center rounded-md border border-border bg-card px-2 text-[11px] font-semibold text-foreground',
          className,
        )}
      >
        {label}
      </span>
    );
  }
  if (variant === 'solid') {
    return (
      <span
        className={cn(
          'inline-flex h-5 items-center rounded-md bg-primary px-2 text-[11px] font-semibold text-primary-foreground',
          className,
        )}
      >
        {label}
      </span>
    );
  }
  // soft (default)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary/85 px-2 py-0.5 text-[11px] font-semibold text-primary-foreground/90',
        className,
      )}
    >
      {label}
    </span>
  );
}
