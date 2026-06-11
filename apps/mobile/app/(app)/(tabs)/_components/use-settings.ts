import type { Floor, PresenceStatus } from '@desko/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

/**
 * Hook dati della tab Impostazioni — /api/settings/*.
 * Stesse server actions del web (updateVisibility, updateWeeklyPattern,
 * archivePastPresences) dietro adapter HTTP.
 */

export type Visibility = 'company' | 'team' | 'followers' | 'hidden';

export type ProfileDto = {
  name: string;
  email: string;
  team: string | null;
  department: string | null;
  defaultFloor: Floor | null;
  visibility: Visibility;
};

export type PatternDto = {
  monday: PresenceStatus;
  tuesday: PresenceStatus;
  wednesday: PresenceStatus;
  thursday: PresenceStatus;
  friday: PresenceStatus;
  defaultFloor: Floor | null;
};

export type SettingsPayload = { profile: ProfileDto; pattern: PatternDto };

const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => api.get<SettingsPayload>('/api/settings'),
    staleTime: 60_000,
  });
}

export type SaveSettingsInput = {
  visibility: Visibility;
  defaultFloor: Floor | null;
  days: Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday', boolean>;
};

/**
 * Un solo Save persiste pattern + visibilità (stessa semantica della
 * pagina /settings web). Invalida settings e presenze: il cambio di
 * visibilità altera ciò che gli altri vedono, ma anche le mie viste.
 */
export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveSettingsInput) => {
      const toStatus = (active: boolean): PresenceStatus =>
        active ? 'in_office' : 'unspecified';
      await Promise.all([
        api.post('/api/settings/pattern', {
          monday: toStatus(input.days.monday),
          tuesday: toStatus(input.days.tuesday),
          wednesday: toStatus(input.days.wednesday),
          thursday: toStatus(input.days.thursday),
          friday: toStatus(input.days.friday),
          defaultFloor: input.defaultFloor,
        }),
        api.post('/api/settings/visibility', { visibility: input.visibility }),
      ]);
      return input;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['presence'] });
    },
  });
}

export function useArchivePresences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { archivedCount: number } }>('/api/settings/archive'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presence'] });
    },
  });
}
