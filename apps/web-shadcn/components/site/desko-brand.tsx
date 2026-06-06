/**
 * <DeskoBrand /> — D logo + opzionale wordmark "Desko".
 *
 * Riusato in: AppShell sidebar collapsed/expanded, topbar mobile,
 * auth pages, landing page. Centralizza dimensioni e classi del badge
 * ocra in un solo posto.
 */
import { cn } from '@desko/ui/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { box: string; text: string; gap: string; wordmark: string }> = {
  sm: {
    box: 'size-6 text-xs',
    text: 'text-xs',
    gap: 'gap-2',
    wordmark: 'text-sm',
  },
  md: {
    box: 'size-7 text-sm',
    text: 'text-sm',
    gap: 'gap-3',
    wordmark: 'text-base',
  },
  lg: {
    box: 'size-9 text-lg',
    text: 'text-lg',
    gap: 'gap-3',
    wordmark: 'text-2xl',
  },
};

type DeskoBrandProps = {
  /** Default `md`. */
  size?: Size;
  /** Mostra il wordmark "Desko" accanto al logo. Default `false` (solo D). */
  wordmark?: boolean;
  className?: string;
};

export function DeskoBrand({
  size = 'md',
  wordmark = false,
  className,
}: DeskoBrandProps) {
  const s = SIZE_MAP[size];
  const badge = (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold',
        s.box,
      )}
    >
      D
    </span>
  );

  if (!wordmark) return <span className={className}>{badge}</span>;

  return (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      {badge}
      <span className={cn('font-extrabold tracking-tight truncate', s.wordmark)}>
        Desko
      </span>
    </span>
  );
}
