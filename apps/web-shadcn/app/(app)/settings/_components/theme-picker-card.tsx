'use client';

import { Check, Loader2, Palette } from 'lucide-react';
import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import { Card } from '@desko/ui/components/card';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { cn } from '@desko/ui/lib/utils';

import { setActiveTheme } from '@/lib/themes/actions';
import type { Theme } from '@/lib/themes/types';

type Props = {
  themes: Theme[];
  activeThemeId: string;
};

/**
 * ThemePickerCard — sezione "Tema visivo" della pagina /settings.
 * Visibile solo per admin (filtraggio fatto nel parent page.tsx).
 *
 * Click "Applica" → setActiveTheme server action → cookie write +
 * revalidatePath('/', 'layout') → tutta l'app re-renderizza con il
 * nuovo theme.
 */
export function ThemePickerCard({ themes, activeThemeId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleApply = (themeId: string) => {
    if (themeId === activeThemeId) return;
    setError(null);
    setPendingId(themeId);
    startTransition(async () => {
      const result = await setActiveTheme(themeId);
      if (!result.ok) {
        setError(result.message);
        setPendingId(null);
        return;
      }
      router.refresh();
      // pendingId resta finché il refresh non rimonta con activeThemeId aggiornato
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="px-5 pt-5 md:px-6 md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
              <Palette className="size-4" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h4 className="text-[17px] font-bold leading-tight">Tema visivo</h4>
              <span className="text-xs text-muted-foreground">
                Colori, tipografia e radii per tutta l&apos;applicazione · solo admin.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 pt-5 md:p-6 md:pt-6">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isActive = theme.id === activeThemeId;
            const isApplying = pending && pendingId === theme.id;
            return (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={isActive}
                isApplying={isApplying}
                disabled={pending}
                onApply={() => handleApply(theme.id)}
              />
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Aggiungere un tema: nuovo file{' '}
          <code className="font-mono text-[11px]">.workflow/themes/&lt;id&gt;.md</code>
          {' '}con frontmatter YAML (colors / typography / radii). Verrà rilevato
          automaticamente.
        </p>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeCard — preview singolo tema con swatch palette + tipografia "Aa"
// ─────────────────────────────────────────────────────────────────────────────
function ThemeCard({
  theme,
  isActive,
  isApplying,
  disabled,
  onApply,
}: {
  theme: Theme;
  isActive: boolean;
  isApplying: boolean;
  disabled: boolean;
  onApply: () => void;
}) {
  // Estrai 4 swatch principali per preview (primary/success/info/destructive)
  const swatches = [
    theme.colors.light.primary,
    theme.colors.light.success,
    theme.colors.light.info,
    theme.colors.light.destructive,
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-md border p-3 transition-colors',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-foreground/30',
      )}
    >
      {/* Swatch row */}
      <div className="flex gap-1.5">
        {swatches.map((hsl, i) => (
          <div
            key={i}
            className="size-6 rounded shrink-0"
            style={{ backgroundColor: `hsl(${hsl})` }}
            aria-hidden
          />
        ))}
        <div
          className="ml-auto inline-flex size-6 items-center justify-center rounded font-bold text-xs"
          style={{
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--foreground))',
          }}
          aria-hidden
          title={`Sans: ${theme.typography.sans}`}
        >
          Aa
        </div>
      </div>

      {/* Name + description */}
      <div className="flex flex-col gap-0.5 min-h-[60px]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">{theme.name}</span>
          {isActive ? (
            <Eyebrow className="text-primary">
              <Check className="inline size-3" /> attivo
            </Eyebrow>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
      </div>

      {/* Action button */}
      <Button
        type="button"
        variant={isActive ? 'outline' : 'default'}
        size="sm"
        disabled={isActive || disabled}
        onClick={onApply}
        className="w-full"
      >
        {isApplying ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isActive ? (
          'Attivo'
        ) : (
          'Applica'
        )}
      </Button>
    </div>
  );
}
