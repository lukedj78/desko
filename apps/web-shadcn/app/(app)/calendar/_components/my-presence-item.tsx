'use client';

import {
  ChevronDown,
  Home,
  Layers,
  Loader2,
  LogOut,
  MinusCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Avatar, AvatarFallback } from '@desko/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@desko/ui/components/dropdown-menu';
import type { Floor } from '@desko/domain';
import type { PresenceEntry } from '@desko/queries/presence';
import { declarePresence, leaveOffice, updateFloor } from '@desko/server-actions/presence';

type Props = {
  entry: PresenceEntry;
  date: string;
};

const FLOOR_LABEL: Record<Floor, string> = {
  seventh_floor: '7° Piano · stanza',
  second_floor: '2° Piano · co-working',
};

const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Card "io" interattiva nella vista giorno: hover + menu azioni cablate alle
 * server actions (sposta piano, passa remoto, esci ufficio, annulla).
 */
export function MyPresenceItem({ entry, date }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const today = isoToday();
  const isToday = date === today;
  const otherFloor: Floor = entry.floor === 'seventh_floor' ? 'second_floor' : 'seventh_floor';

  const run = (label: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setToast(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        alert(res.message ?? 'Operazione fallita.');
        return;
      }
      setToast(label);
      router.refresh();
      setTimeout(() => setToast(null), 2500);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={pending}
            className="group flex w-full items-center gap-3 rounded-lg border border-primary bg-primary/10 px-3 py-2.5 text-left transition-colors hover:bg-primary/20 hover:border-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ width: 260 }}
          >
            <Avatar className="size-9 ring-2 ring-primary shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {entry.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-sm font-semibold">
                  {entry.displayName.replace(' (tu)', '')}
                </span>
                <span className="inline-flex items-center rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary-foreground shrink-0">
                  Tu
                </span>
              </div>
              <span className="truncate text-[11px] text-muted-foreground">
                {entry.team ?? '—'}
              </span>
            </div>
            {pending ? (
              <Loader2 className="size-4 animate-spin shrink-0" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="min-w-[240px]">
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              La tua presenza
            </span>
            <span className="text-sm font-semibold">
              {entry.floor ? FLOOR_LABEL[entry.floor] : 'In ufficio · piano da definire'}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {entry.floor !== null ? (
            <DropdownMenuItem
              onClick={() =>
                run(`Spostato al ${otherFloor === 'seventh_floor' ? '7°' : '2°'} piano`, () =>
                  updateFloor({ date, floor: otherFloor }),
                )
              }
            >
              <Layers className="size-4" />
              <div className="flex flex-col flex-1">
                <span className="font-semibold">
                  Sposta al {otherFloor === 'seventh_floor' ? '7°' : '2°'} piano
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {FLOOR_LABEL[otherFloor]}
                </span>
              </div>
            </DropdownMenuItem>
          ) : null}

          {entry.floor === null ? (
            <DropdownMenuItem
              onClick={() =>
                run('Piano impostato a 7°', () =>
                  updateFloor({ date, floor: 'seventh_floor' }),
                )
              }
            >
              <Layers className="size-4" />
              <span className="font-semibold">Sposta al 7° piano</span>
            </DropdownMenuItem>
          ) : null}

          {entry.floor === null ? (
            <DropdownMenuItem
              onClick={() =>
                run('Piano impostato a 2°', () =>
                  updateFloor({ date, floor: 'second_floor' }),
                )
              }
            >
              <Layers className="size-4" />
              <span className="font-semibold">Sposta al 2° piano</span>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            onClick={() =>
              run('Passato a remoto', () =>
                declarePresence({ date, status: 'remote', floor: null }),
              )
            }
          >
            <Home className="size-4 text-info" />
            <div className="flex flex-col flex-1">
              <span className="font-semibold">Passa a lavoro da remoto</span>
              <span className="text-[11px] text-muted-foreground">
                Cambi la dichiarazione del giorno
              </span>
            </div>
          </DropdownMenuItem>

          {isToday ? (
            <DropdownMenuItem
              onClick={() => run("Uscita dall'ufficio confermata", () => leaveOffice())}
            >
              <LogOut className="size-4 text-warning" />
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-warning">Esci dall&apos;ufficio</span>
                <span className="text-[11px] text-muted-foreground">
                  Aggiorna lo stato a remoto · solo oggi
                </span>
              </div>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            onClick={() =>
              run('Dichiarazione annullata', () =>
                declarePresence({ date, status: 'unspecified', floor: null }),
              )
            }
          >
            <MinusCircle className="size-4 text-destructive" />
            <div className="flex flex-col flex-1">
              <span className="font-semibold text-destructive">Annulla la dichiarazione</span>
              <span className="text-[11px] text-muted-foreground">
                Rimuovi la presenza per questo giorno
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-success text-success-foreground px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      ) : null}
    </>
  );
}
