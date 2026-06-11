'use client';

import { Search, UserMinus, UserPlus, Users } from 'lucide-react';
import * as React from 'react';

import { followUser, unfollowUser } from '@desko/server-actions/presence';
import { Button } from '@desko/ui/components/button';
import { Card } from '@desko/ui/components/card';
import { Input } from '@desko/ui/components/input';

type FollowedUser = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
};

type SearchResult = FollowedUser & { email: string };

/**
 * Card "Colleghi che segui" (US-3).
 *
 * - Lista: arriva dal Server Component (props); follow/unfollow chiamano le
 *   server actions, che fanno revalidatePath('/settings') → la lista si
 *   aggiorna via RSC senza stato client duplicato.
 * - Ricerca: /api/users/search invocata nell'event handler dell'input
 *   (debounce manuale) — i risultati sono UI effimera locale, non server
 *   state da cache.
 */
export function FollowsCard({ follows }: { follows: FollowedUser[] }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const followedIds = React.useMemo(() => new Set(follows.map((f) => f.userId)), [follows]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        const body = (await res.json()) as { users?: SearchResult[] };
        setResults(body.users ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  function handleFollow(targetUserId: string) {
    setError(null);
    startTransition(async () => {
      const res = await followUser({ targetUserId });
      if (!res.ok) setError(res.message);
    });
  }

  function handleUnfollow(targetUserId: string) {
    setError(null);
    startTransition(async () => {
      const res = await unfollowUser({ targetUserId });
      if (!res.ok) setError(res.message);
    });
  }

  return (
    <Card className="flex flex-col gap-5 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          <Users className="size-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="text-[17px] font-bold leading-tight">Colleghi che segui</h4>
          <span className="text-xs text-muted-foreground">
            Le persone che ti interessano: filtra calendario e presenze su di loro. Max 50.
          </span>
        </div>
      </div>

      {/* Ricerca + aggiungi */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Cerca un collega per nome o email…"
            className="pl-9"
            aria-label="Cerca colleghi da seguire"
          />
        </div>
        {searching ? (
          <span className="text-xs text-muted-foreground">Ricerca…</span>
        ) : (
          results.length > 0 && (
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {results.map((u) => {
                const already = followedIds.has(u.userId);
                return (
                  <div key={u.userId} className="flex items-center gap-3 p-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full border border-primary bg-primary/10 text-xs font-bold">
                      {u.initials}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">{u.displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {u.email}
                        {u.team ? ` · ${u.team}` : ''}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={already ? 'outline' : 'default'}
                      disabled={already || pending}
                      onClick={() => handleFollow(u.userId)}
                    >
                      <UserPlus className="size-4" />
                      {already ? 'Già seguito' : 'Segui'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Lista seguiti */}
      {follows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
          Non segui ancora nessuno. Cerca un collega qui sopra per iniziare.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-md border border-border">
          {follows.map((f) => (
            <div key={f.userId} className="flex items-center gap-3 p-3">
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-primary bg-primary/10 text-xs font-bold">
                {f.initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{f.displayName}</span>
                {f.team ? (
                  <span className="text-xs text-muted-foreground">{f.team}</span>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => handleUnfollow(f.userId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <UserMinus className="size-4" />
                Rimuovi
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
