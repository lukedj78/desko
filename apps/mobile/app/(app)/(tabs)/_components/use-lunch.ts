import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

/**
 * Hook dati della tab Pranzo — /api/lunch/*.
 * DTO locali (contratto JSON dell'API): @desko/queries è server-only.
 */

export type CuisineDto =
  | 'italian'
  | 'pizza'
  | 'sushi'
  | 'asian'
  | 'salad'
  | 'burger'
  | 'bistro'
  | 'bakery'
  | 'fusion'
  | 'other';

export type RestaurantDto = {
  id: string;
  name: string;
  cuisine: CuisineDto;
  priceRange: '€' | '€€' | '€€€';
  address: string;
  distanceM: number | null;
  description: string | null;
  emoji: string | null;
  mapsUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
};

export type LunchParticipantDto = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
};

export type LunchProposalDto = {
  id: string;
  date: string;
  meetingTime: string;
  visibility: 'public' | 'private';
  status: 'open' | 'cancelled';
  note: string | null;
  maxParticipants: number | null;
  createdBy: LunchParticipantDto;
  restaurant: RestaurantDto;
  participants: LunchParticipantDto[];
  iAmCreator: boolean;
  iAmParticipant: boolean;
  iAmInvited: boolean;
  invitedCount: number;
};

export function useLunchProposals(date?: string) {
  return useQuery({
    queryKey: ['lunch', 'proposals', { date: date ?? 'today' }] as const,
    queryFn: () =>
      api.get<{ proposals: LunchProposalDto[] }>(
        date ? `/api/lunch/proposals?date=${date}` : '/api/lunch/proposals',
      ),
    staleTime: 60_000,
  });
}

export function useRestaurants() {
  return useQuery({
    queryKey: ['lunch', 'restaurants'] as const,
    queryFn: () => api.get<{ restaurants: RestaurantDto[] }>('/api/lunch/restaurants'),
    staleTime: 5 * 60_000,
  });
}

function useInvalidateLunch() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['lunch'] });
}

export function useCreateLunchProposal() {
  const invalidate = useInvalidateLunch();
  return useMutation({
    mutationFn: (input: {
      restaurantId: string;
      date: string;
      meetingTime: string;
      visibility: 'public';
      maxParticipants?: number | null;
      note?: string;
    }) => api.post<{ data: { proposalId: string } }>('/api/lunch/proposals', input),
    onSuccess: invalidate,
  });
}

export function useJoinLunch() {
  const invalidate = useInvalidateLunch();
  return useMutation({
    mutationFn: (proposalId: string) => api.post('/api/lunch/join', { proposalId }),
    onSuccess: invalidate,
  });
}

export function useLeaveLunch() {
  const invalidate = useInvalidateLunch();
  return useMutation({
    mutationFn: (proposalId: string) => api.post('/api/lunch/leave', { proposalId }),
    onSuccess: invalidate,
  });
}

export function useCancelLunch() {
  const invalidate = useInvalidateLunch();
  return useMutation({
    mutationFn: (proposalId: string) => api.post('/api/lunch/cancel', { proposalId }),
    onSuccess: invalidate,
  });
}
