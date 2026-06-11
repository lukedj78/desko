import type { Floor, PresenceStatus } from '@desko/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, todayIso } from '@/lib/api';

/**
 * Hook dati della tab "Oggi" — TanStack Query su /api/presence/*.
 *
 * DTO definiti qui (non importati da @desko/queries): quel package è
 * server-only (drizzle, next/headers) e non deve entrare nel grafo
 * di typecheck/bundle del mobile. La shape è il contratto JSON dell'API.
 */

export type PresenceEntryDto = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
  date: string;
  status: PresenceStatus;
  floor: Floor | null;
  lastFloorUpdateAt: string | null;
  isLastMinute: boolean;
};

export type TodayPayload = {
  me: { status: PresenceStatus; floor: Floor | null; lastFloorUpdateAt: string | null };
  counts: {
    inOfficeCertain: number;
    inOfficeFromPattern: number;
    lastMinute: number;
    totalDeclared: number;
    remote: number;
  };
  entries: PresenceEntryDto[];
};

export type MonthAttendeeDto = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
  floor: Floor | null;
};

export type MonthDayPresenceDto = {
  date: string; // YYYY-MM-DD
  attendees: MonthAttendeeDto[];
};

const TODAY_KEY = ['presence', 'today'] as const;

export function usePresenceToday() {
  return useQuery({
    queryKey: TODAY_KEY,
    queryFn: () => api.get<TodayPayload>('/api/presence/today'),
    staleTime: 60_000,
  });
}

/** Presenze in_office per intervallo (griglia mese del calendario). */
export function usePresenceRange(from: string, to: string) {
  return useQuery({
    queryKey: ['presence', 'range', { from, to }] as const,
    queryFn: () =>
      api.get<{ days: MonthDayPresenceDto[] }>(`/api/presence/range?from=${from}&to=${to}`),
    staleTime: 60_000,
  });
}

function useInvalidatePresence() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['presence'] });
}

export function useDeclarePresence() {
  const invalidate = useInvalidatePresence();
  return useMutation({
    mutationFn: (input: {
      status: PresenceStatus;
      floor?: Floor | null;
      note?: string;
      /** default: oggi — il calendario passa la data selezionata */
      date?: string;
    }) => api.post('/api/presence/declare', { ...input, date: input.date ?? todayIso() }),
    onSuccess: invalidate,
  });
}

export function useLeaveOffice() {
  const invalidate = useInvalidatePresence();
  return useMutation({
    mutationFn: () => api.post('/api/presence/leave'),
    onSuccess: invalidate,
  });
}

export function useUpdateFloor() {
  const invalidate = useInvalidatePresence();
  return useMutation({
    mutationFn: (floor: Floor) => api.post('/api/presence/floor', { date: todayIso(), floor }),
    onSuccess: invalidate,
  });
}
