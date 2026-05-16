'use client';

import { Check, ChevronsUpDown, Globe, Loader2, Lock, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Alert } from '@desko/ui/components/alert';
import { Avatar, AvatarFallback } from '@desko/ui/components/avatar';
import { Button } from '@desko/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@desko/ui/components/command';
import { DatePicker } from '@desko/ui/components/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@desko/ui/components/dialog';
import { Field } from '@desko/ui/components/field';
import { Label } from '@desko/ui/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@desko/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@desko/ui/components/select';
import { TimePicker } from '@desko/ui/components/time-picker';
import { ToggleGroup, ToggleGroupItem } from '@desko/ui/components/toggle-group';
import { cn } from '@desko/ui/lib/utils';
import type { RestaurantWithRating } from '@desko/queries/lunch';
import { createLunchProposal } from '@desko/server-actions/lunch';

type InvitableUser = {
  userId: string;
  displayName: string;
  email: string;
  initials: string;
  team: string | null;
};

type Props = {
  restaurants: RestaurantWithRating[];
  invitableUsers: InvitableUser[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function CreateProposalButton({ restaurants, invitableUsers }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [restaurantId, setRestaurantId] = React.useState<string>('');
  const [date, setDate] = React.useState<Date | undefined>(startOfToday());
  const [meetingTime, setMeetingTime] = React.useState<string>('13:00');
  const [visibility, setVisibility] = React.useState<'public' | 'private'>('public');
  const [note, setNote] = React.useState<string>('');
  const [invitees, setInvitees] = React.useState<string[]>([]);
  const [inviteeOpen, setInviteeOpen] = React.useState(false);

  const reset = () => {
    setRestaurantId('');
    setDate(startOfToday());
    setMeetingTime('13:00');
    setVisibility('public');
    setNote('');
    setInvitees([]);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!restaurantId) {
      setError('Scegli un ristorante.');
      return;
    }
    if (!date) {
      setError('Scegli una data.');
      return;
    }
    if (visibility === 'private' && invitees.length === 0) {
      setError('Una proposta privata deve avere almeno un invitato.');
      return;
    }
    startTransition(async () => {
      const res = await createLunchProposal({
        restaurantId,
        date: toIsoDate(date),
        meetingTime,
        visibility,
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

  const toggleInvitee = (userId: string) => {
    setInvitees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectedInvitees = invitees
    .map((id) => invitableUsers.find((u) => u.userId === id))
    .filter((u): u is InvitableUser => Boolean(u));

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Crea proposta
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (pending) return;
          if (o) setOpen(true);
          else {
            setOpen(false);
            reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Nuova proposta di pranzo</DialogTitle>
            <DialogDescription>
              Scegli ristorante, data e orario. Pubblica = visibile a tutti i colleghi attivi.
              Privata = solo agli invitati.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error ? <Alert variant="destructive">{error}</Alert> : null}

            {/* Ristorante */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proposal-restaurant" className="flex items-baseline gap-1">
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
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {r.priceRange}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data + Orario */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proposal-date" className="flex items-baseline gap-1">
                  Data <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  id="proposal-date"
                  value={date}
                  onChange={setDate}
                  minDate={startOfToday()}
                  placeholder="Scegli una data"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proposal-time" className="flex items-baseline gap-1">
                  Orario <span className="text-destructive">*</span>
                </Label>
                <TimePicker
                  id="proposal-time"
                  value={meetingTime}
                  onChange={setMeetingTime}
                  minuteStep={5}
                  minHour={11}
                  maxHour={15}
                />
              </div>
            </div>

            {/* Visibilità */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Visibilità
              </Label>
              <ToggleGroup
                type="single"
                value={visibility}
                onValueChange={(v) => v && setVisibility(v as 'public' | 'private')}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="public"
                  className="h-auto justify-start gap-3 rounded-md border border-border bg-card p-3 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <Globe className="size-4 shrink-0" />
                  <span className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold">Pubblica</span>
                    <span className="text-xs text-muted-foreground">Visibile a tutti</span>
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="private"
                  className="h-auto justify-start gap-3 rounded-md border border-border bg-card p-3 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <Lock className="size-4 shrink-0" />
                  <span className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold">Privata</span>
                    <span className="text-xs text-muted-foreground">Solo invitati</span>
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Invitati — Combobox multi-select (solo se privata) */}
            {visibility === 'private' ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proposal-invitees" className="flex items-baseline gap-1">
                  Invitati <span className="text-destructive">*</span>
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {invitees.length} selezionati
                  </span>
                </Label>

                {/* Chip selected list */}
                {selectedInvitees.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 rounded-md border border-dashed border-border p-2">
                    {selectedInvitees.map((u) => (
                      <span
                        key={u.userId}
                        className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        <Avatar className="size-5">
                          <AvatarFallback className="bg-card text-[9px] font-bold">
                            {u.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.displayName}</span>
                        <button
                          type="button"
                          onClick={() => toggleInvitee(u.userId)}
                          aria-label={`Rimuovi ${u.displayName}`}
                          className="inline-flex size-4 items-center justify-center rounded-full hover:bg-foreground/10"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                <Popover open={inviteeOpen} onOpenChange={setInviteeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="proposal-invitees"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={inviteeOpen}
                      className="h-11 justify-between font-normal"
                    >
                      <span className="text-muted-foreground">
                        {invitees.length === 0
                          ? 'Aggiungi colleghi…'
                          : `${invitees.length} ${invitees.length === 1 ? 'invitato' : 'invitati'}`}
                      </span>
                      <ChevronsUpDown className="size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cerca nome o team…" />
                      <CommandList>
                        <CommandEmpty>Nessun collega trovato.</CommandEmpty>
                        <CommandGroup>
                          {invitableUsers.map((u) => {
                            const checked = invitees.includes(u.userId);
                            return (
                              <CommandItem
                                key={u.userId}
                                value={`${u.displayName} ${u.team ?? ''} ${u.email}`}
                                onSelect={() => toggleInvitee(u.userId)}
                                className="gap-3"
                              >
                                <Avatar className="size-7 shrink-0">
                                  <AvatarFallback className="bg-muted text-[11px] font-bold">
                                    {u.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate text-sm font-semibold">
                                    {u.displayName}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {u.team ?? u.email}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    'size-4 shrink-0',
                                    checked ? 'opacity-100 text-primary' : 'opacity-0',
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Crea proposta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
