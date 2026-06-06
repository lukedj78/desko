'use client';

import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@desko/ui/components/button';
import { Eyebrow } from '@desko/ui/components/eyebrow';
import { cn } from '@desko/ui/lib/utils';

import { useUsersAdmin } from './context';

export function Header() {
  const { loading, fetchUsers } = useUsersAdmin();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>Admin · gestione utenti</Eyebrow>
        <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
          Utenti e ruoli.
        </h1>
        <p className="text-base text-muted-foreground">
          Crea, assegna ruoli, banna, revoca sessioni o impersona utenti.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void fetchUsers()}
          disabled={loading}
          aria-label="Aggiorna lista"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
        </Button>
        <Button>
          <Plus className="size-4" />
          Nuovo utente
        </Button>
      </div>
    </div>
  );
}
