'use client';

import { Clock, Globe, Loader2, Lock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Alert } from '@desko/ui/components/alert';
import { Avatar, AvatarFallback } from '@desko/ui/components/avatar';
import { Badge } from '@desko/ui/components/badge';
import { Button } from '@desko/ui/components/button';
import { Card } from '@desko/ui/components/card';
import type { ProposalSummary } from '@desko/queries/lunch';
import {
  cancelLunchProposal,
  joinLunchProposal,
  leaveLunchProposal,
} from '@desko/server-actions/lunch';
import { cn } from '@desko/ui/lib/utils';

type Props = {
  proposals: ProposalSummary[];
  myUserId: string;
  emptyAction?: boolean;
};

const PRICE_TONE: Record<string, string> = {
  '€': 'text-info',
  '€€': 'text-primary-foreground',
  '€€€': 'text-[#9C5BCC]',
};

export function LunchProposalsList({ proposals, myUserId, emptyAction }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (id: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await fn();
      setPendingId(null);
      if (!res.ok) {
        setError(res.message ?? 'Operazione fallita.');
        return;
      }
      router.refresh();
    });
  };

  if (proposals.length === 0) {
    return (
      <Card className="p-8 text-center bg-muted/30 border-dashed">
        <p className="font-semibold">Nessuna proposta {emptyAction ? 'per oggi' : ''}.</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {emptyAction
            ? 'Crea tu la prima proposta — scegli un ristorante e dai appuntamento ai colleghi.'
            : 'Nessuno ha ancora organizzato un pranzo.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive" onClick={() => setError(null)} className="cursor-pointer">
          {error}
        </Alert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {proposals.map((p) => {
          const isFull =
            p.maxParticipants !== null && p.participants.length >= p.maxParticipants;
          const showJoin = !p.iAmParticipant && !isFull;
          const showLeave = p.iAmParticipant && !p.iAmCreator;
          const showCancel = p.iAmCreator;
          const rowPending = pendingId === p.id && isPending;

          return (
            <Card key={p.id} className="overflow-hidden">
              {/* Header */}
              <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-card text-xl shrink-0">
                  {p.restaurant.emoji ?? '🍽️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold truncate">{p.restaurant.name}</span>
                    <span
                      className={cn(
                        'font-mono text-xs font-bold',
                        PRICE_TONE[p.restaurant.priceRange] ?? 'text-muted-foreground',
                      )}
                    >
                      {p.restaurant.priceRange}
                    </span>
                    {p.restaurant.ratingCount > 0 ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="size-3.5 fill-primary text-primary" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          {p.restaurant.ratingAvg.toFixed(1)}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.restaurant.address}
                    {p.restaurant.distanceM ? ` · ~${p.restaurant.distanceM}m` : ''}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0',
                    p.visibility === 'private'
                      ? 'bg-destructive/10 text-destructive border-destructive/30'
                      : 'bg-success/10 text-success border-success/30',
                  )}
                >
                  {p.visibility === 'private' ? (
                    <Lock className="size-3" />
                  ) : (
                    <Globe className="size-3" />
                  )}
                  {p.visibility === 'private' ? 'Privata' : 'Pubblica'}
                </Badge>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="font-mono text-base font-bold">{p.meetingTime}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    organizza <strong className="text-foreground">{p.createdBy.displayName}</strong>
                  </span>
                </div>

                {p.note ? (
                  <p className="text-sm italic bg-muted/50 rounded-md px-3 py-2">
                    &ldquo;{p.note}&rdquo;
                  </p>
                ) : null}

                <div className="flex items-center gap-3">
                  <div className="flex flex-row-reverse items-center">
                    {p.participants.slice(0, 5).reverse().map((u, i) => (
                      <Avatar
                        key={u.userId}
                        className={cn('size-7 ring-2 ring-primary', i > 0 && '-mr-2.5')}
                      >
                        <AvatarFallback
                          className={cn(
                            'text-[10px] font-bold',
                            u.userId === myUserId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted',
                          )}
                        >
                          {u.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {p.participants.length}
                    {p.maxParticipants ? ` / ${p.maxParticipants}` : ''}{' '}
                    {p.participants.length === 1 ? 'iscritto' : 'iscritti'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {showJoin ? (
                    <Button disabled={rowPending} onClick={() => run(p.id, () => joinLunchProposal({ proposalId: p.id }))}>
                      {rowPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Unisciti
                    </Button>
                  ) : null}
                  {showLeave ? (
                    <Button
                      variant="outline"
                      disabled={rowPending}
                      onClick={() => run(p.id, () => leaveLunchProposal({ proposalId: p.id }))}
                    >
                      Esci
                    </Button>
                  ) : null}
                  {showCancel ? (
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={rowPending}
                      onClick={() => {
                        if (confirm('Cancellare la proposta?'))
                          run(p.id, () => cancelLunchProposal({ proposalId: p.id }));
                      }}
                    >
                      Cancella proposta
                    </Button>
                  ) : null}
                  {isFull && !p.iAmParticipant ? (
                    <Badge variant="destructive">Posti esauriti</Badge>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
