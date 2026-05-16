'use client';

import { Eye, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@desko/ui/components/button';
import { admin } from '@/lib/auth-client';

type Props = {
  impersonatedUser: { name: string; email: string };
};

/**
 * Banner sticky in cima alle pagine (app) quando session.session.impersonatedBy
 * non è null. Cliccando "Torna admin" si chiama admin.stopImpersonating().
 */
export function ImpersonationBanner({ impersonatedUser }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStop = async () => {
    setPending(true);
    setError(null);
    const { error: err } = await admin.stopImpersonating();
    if (err) {
      setError(err.message ?? 'Impossibile uscire dall’impersonate.');
      setPending(false);
      return;
    }
    router.push('/admin/users');
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-50 border-b-2 border-warning/70 bg-warning text-warning-foreground">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-6 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <Eye className="size-4 shrink-0" />
          <span className="text-sm font-bold">Modalità impersonate</span>
          <span className="truncate text-sm font-mono opacity-90">
            {impersonatedUser.name} · {impersonatedUser.email}
          </span>
        </div>
        {error ? (
          <span className="flex-1 text-xs font-semibold opacity-90">{error}</span>
        ) : (
          <div className="flex-1" />
        )}
        <Button
          size="sm"
          disabled={pending}
          onClick={handleStop}
          className="bg-card text-foreground hover:bg-card/90"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
          Torna admin
        </Button>
      </div>
    </div>
  );
}
