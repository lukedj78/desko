import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

/** Hook US-3 "chi seguo" — /api/follows + /api/users/search. */

export type FollowedUserDto = {
  userId: string;
  displayName: string;
  initials: string;
  team: string | null;
};

export type UserSearchResultDto = FollowedUserDto & { email: string };

export function useFollows(enabled = true) {
  return useQuery({
    queryKey: ['follows'] as const,
    queryFn: () => api.get<{ follows: FollowedUserDto[] }>('/api/follows'),
    staleTime: 60_000,
    enabled,
  });
}

function useInvalidateFollows() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['follows'] });
}

export function useFollowUser() {
  const invalidate = useInvalidateFollows();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      api.post('/api/follows/follow', { targetUserId }),
    onSuccess: invalidate,
  });
}

export function useUnfollowUser() {
  const invalidate = useInvalidateFollows();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      api.post('/api/follows/unfollow', { targetUserId }),
    onSuccess: invalidate,
  });
}

/** Ricerca colleghi — chiamata dall'event handler dell'input (no cache). */
export async function searchUsers(q: string): Promise<UserSearchResultDto[]> {
  if (q.trim().length < 2) return [];
  const res = await api.get<{ users: UserSearchResultDto[] }>(
    `/api/users/search?q=${encodeURIComponent(q.trim())}`,
  );
  return res.users;
}
