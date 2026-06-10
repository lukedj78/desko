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

const TODAY_KEY = ['presence', 'today'] as const;

export function usePresenceToday() {
  return useQuery({
    queryKey: TODAY_KEY,
    queryFn: () => api.get<TodayPayload>('/api/presence/today'),
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
    mutationFn: (input: { status: PresenceStatus; floor?: Floor | null; note?: string }) =>
      api.post('/api/presence/declare', { date: todayIso(), ...input }),
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
