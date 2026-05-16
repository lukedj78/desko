'use client';

import { Globe, Loader2, Lock, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { RestaurantWithRating } from '@desko/queries/lunch';
import { createLunchProposal } from '@desko/server-actions/lunch';

type InvitableUser = {
  userId: string; displayName: string; email: string; initials: string; team: string | null;
};

type Props = {
  restaurants: RestaurantWithRating[];
  invitableUsers: InvitableUser[];
};

const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function CreateProposalButton({ restaurants, invitableUsers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [restaurantId, setRestaurantId] = useState<string>('');
  const [date, setDate] = useState<string>(isoToday());
  const [meetingTime, setMeetingTime] = useState<string>('13:00');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [note, setNote] = useState<string>('');
  const [invitees, setInvitees] = useState<string[]>([]);

  const reset = () => {
    setRestaurantId(''); setDate(isoToday()); setMeetingTime('13:00');
    setVisibility('public'); setNote(''); setInvitees([]); setError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!restaurantId) {
      setError('Scegli un ristorante.');
      return;
    }
    if (visibility === 'private' && invitees.length === 0) {
      setError('Una proposta privata deve avere almeno un invitato.');
      return;
    }
    startTransition(async () => {
      const res = await createLunchProposal({
        restaurantId, date, meetingTime, visibility,
        note: note.trim() || undefined,
        inviteUserIds: visibility === 'private' ? invitees : [],
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Crea proposta
      </Button>

      <Dialog open={open} onOpenChange={(o) => !pending && (o ? setOpen(o) : (setOpen(false), reset()))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova proposta di pranzo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? <Alert variant="destructive">{error}</Alert> : null}

            {/* Ristorante */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="proposal-restaurant" className="flex items-baseline gap-2">
                Ristorante <span className="text-destructive">*</span>
              </Label>
              <Select value={restaurantId} onValueChange={setRestaurantId}>
                <SelectTrigger id="proposal-restaurant">
                  <SelectValue placeholder="Scegli un ristorante…" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="mr-2">{r.emoji ?? '🍽️'}</span>
                      <span className="font-semibold">{r.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        {r.priceRange}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data + ora */}
            <div className="flex gap-3">
              <Field
                id="proposal-date"
                label="Data"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={isoToday()}
                containerClassName="flex-1"
              />
              <Field
                id="proposal-time"
                label="Orario"
                type="time"
                required
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                step={300}
                containerClassName="w-32"
              />
            </div>

            {/* Visibilità */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Visibilità
              </Label>
              <ToggleGroup
                type="single"
                value={visibility}
                onValueChange={(v) => v && setVisibility(v as 'public' | 'private')}
              >
                <ToggleGroupItem value="public">
                  <Globe className="size-4" />
                  Pubblica
                </ToggleGroupItem>
                <ToggleGroupItem value="private">
                  <Lock className="size-4" />
                  Privata
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                {visibility === 'public'
                  ? 'Tutti i colleghi attivi vedono la proposta e possono unirsi.'
                  : 'Solo gli invitati vedono la proposta e possono unirsi.'}
              </p>
            </div>

            {/* Inviti — solo private (multiselect via checkbox lista) */}
            {visibility === 'private' ? (
              <div className="flex flex-col gap-2">
                <Label className="flex items-baseline gap-2">
                  Invitati <span className="text-destructive">*</span>
                </Label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-md p-2 flex flex-col gap-1">
                  {invitableUsers.map((u) => (
                    <label
                      key={u.userId}
                      className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={invitees.includes(u.userId)}
                        onChange={(e) =>
                          setInvitees((prev) =>
                            e.target.checked
                              ? [...prev, u.userId]
                              : prev.filter((id) => id !== u.userId),
                          )
                        }
                        className="size-4 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.team ?? u.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invitees.length} invitati selezionati
                </p>
              </div>
            ) : null}

            <Field
              id="proposal-note"
              label="Nota"
              optional
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. ci troviamo davanti al portone"
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => { setOpen(false); reset(); }}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Crea proposta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
