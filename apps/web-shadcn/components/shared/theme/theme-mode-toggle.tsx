'use client';

import { Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@desko/ui/components/tooltip';

import { setThemeMode } from '@/lib/themes/actions';
import type { ThemeMode } from '@/lib/themes/registry.server';

/**
 * Toggle light/dark mode.
 *
 * State source-of-truth: cookie HTTP-only `desko:theme-mode` letto
 * server-side dal root layout (zero FOUC). Il componente è puro
 * "azionatore" — server action `setThemeMode` scrive il cookie e
 * `router.refresh()` rifa il render server-side col nuovo mode.
 *
 * Non admin-only: ogni utente autenticato sceglie la propria preferenza.
 */
export function ThemeModeToggle({ mode }: { mode: ThemeMode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
  const Icon = mode === 'dark' ? Sun : Moon;
  const label = mode === 'dark' ? 'Attiva modalità chiara' : 'Attiva modalità scura';

  function handleToggle() {
    startTransition(async () => {
      const res = await setThemeMode(next);
      if (res.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            disabled={pending}
            onClick={handleToggle}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <Icon className="size-5" />
          </button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
