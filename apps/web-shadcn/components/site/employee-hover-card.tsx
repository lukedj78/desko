'use client';

import { Mail, UserPlus } from 'lucide-react';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@desko/ui/components/avatar';
import { Button } from '@desko/ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@desko/ui/components/tooltip';
import type { PresenceEntry } from '@desko/queries/presence';

import { FloorBadge } from './floor-badge';

const TEAM_COLORS: Record<string, string> = {
  Engineering: '#3D87C9',
  Product: '#2D7A3F',
  Marketing: '#C73E44',
  Sales: '#9C5BCC',
  HR: '#D4A625',
};

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const updated = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(0, Math.round((now - updated) / 60000));
  if (diffMin < 1) return 'adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h fa`;
  return `${Math.round(diffH / 24)}g fa`;
}

function EmployeeMiniCard({ entry }: { entry: PresenceEntry }) {
  const teamColor = entry.team ? TEAM_COLORS[entry.team] ?? '#868685' : '#868685';
  return (
    <div className="p-3 min-w-[260px] text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="size-12 ring-2 ring-primary">
          <AvatarFallback className="bg-muted text-foreground text-base font-bold">
            {entry.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-tight truncate">{entry.displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {entry.team ? (
              <span
                className="inline-block size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: teamColor }}
              />
            ) : null}
            <span className="text-[11px] text-muted-foreground">{entry.team ?? '—'}</span>
          </div>
        </div>
        <button
          aria-label="Email"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Mail className="size-4" />
        </button>
      </div>

      <div className="h-px bg-border mb-3" />

      {/* Status info */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Posizione
          </span>
          <FloorBadge floor={entry.floor} variant="outline" showFull />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Aggiornato
          </span>
          <span className="text-[11px] font-mono">{relativeTime(entry.lastFloorUpdateAt)}</span>
        </div>
        {entry.isLastMinute ? (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Modalità
            </span>
            <span className="text-[11px] font-bold text-warning">Last-minute</span>
          </div>
        ) : null}
      </div>

      <div className="h-px bg-border my-3" />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
          Vedi profilo
        </Button>
        <Button size="sm" className="flex-1 h-8 text-xs">
          <UserPlus className="size-3.5" />
          Segui
        </Button>
      </div>
    </div>
  );
}

export function EmployeeHoverCard({
  entry,
  children,
  isMe,
}: {
  entry: PresenceEntry;
  children: React.ReactElement;
  isMe?: boolean;
}) {
  if (isMe) return <>{children}</>;

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        {/*
         * span wrapper come cuscinetto neutro (eredità del fix
         * hydration Radix; Base UI usa render={} ma il pattern resta
         * pulito sintatticamente).
         */}
        <TooltipTrigger render={<span className="inline-flex">{children}</span>} />
        <TooltipContent
          side="top"
          sideOffset={6}
          className="p-0 bg-card text-foreground border border-border shadow-xl rounded-lg max-w-[320px]"
        >
          <EmployeeMiniCard entry={entry} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
