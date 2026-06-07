'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { admin } from '@/lib/auth-client';

import type { AdminUser, Role } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────
type UsersAdminContextValue = {
  // Identity
  currentUserId: string;

  // Data (provenienti da Server Component come prop)
  users: AdminUser[];
  filteredUsers: AdminUser[];

  // Refresh / errori UI
  refresh: () => void;
  refreshing: boolean;
  error: string | null;
  clearError: () => void;

  // Filtri sincronizzati con URL searchParams (q + role)
  search: string;
  setSearch: (v: string) => void;
  roleFilter: Role | 'all';
  setRoleFilter: (v: Role | 'all') => void;

  // Modali
  actionsDialog: AdminUser | null;
  openActionsDialog: (u: AdminUser) => void;
  closeActionsDialog: () => void;

  deleteDialog: AdminUser | null;
  openDeleteDialog: (u: AdminUser) => void;
  closeDeleteDialog: () => void;

  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  deletePending: boolean;

  impersonatingId: string | null;

  // Mutation handlers (chiamano admin.* e poi router.refresh())
  handleRoleChange: (userId: string, role: Role) => Promise<void>;
  handleImpersonate: (userId: string) => Promise<void>;
  handleRevokeSessions: (userId: string) => Promise<void>;
  handleBan: (u: AdminUser) => Promise<void>;
  handleUnban: (u: AdminUser) => Promise<void>;
  handleDelete: () => Promise<void>;
};

const UsersAdminContext = React.createContext<UsersAdminContextValue | null>(null);

/** Hook per consumare il context. Lancia error se usato fuori dal Provider. */
export function useUsersAdmin(): UsersAdminContextValue {
  const ctx = React.useContext(UsersAdminContext);
  if (!ctx) {
    throw new Error('useUsersAdmin must be used inside <UsersAdminProvider>');
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
type ProviderProps = {
  currentUserId: string;
  initialUsers: AdminUser[];
  initialError: string | null;
  children: React.ReactNode;
};

export function UsersAdminProvider({
  currentUserId,
  initialUsers,
  initialError,
  children,
}: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optimistic users — applica setRole immediato in UI, server-render fa
  // la sync vera al successivo router.refresh()
  const [optimisticUsers, applyOptimisticUsers] = React.useOptimistic<
    AdminUser[],
    { userId: string; role: Role }
  >(initialUsers, (current, change) =>
    current.map((u) => (u.id === change.userId ? { ...u, role: change.role } : u)),
  );

  // Refresh (revalidate Server Component)
  const [refreshing, startRefresh] = React.useTransition();
  const refresh = React.useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router]);

  // UI state locale (no useEffect, no server data)
  const [error, setError] = React.useState<string | null>(initialError);
  const [actionsDialog, setActionsDialog] = React.useState<AdminUser | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<AdminUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [deletePending, setDeletePending] = React.useState(false);
  const [impersonatingId, setImpersonatingId] = React.useState<string | null>(null);

  // ── URL-bound filters (state-discipline rung 2 + data-fetching) ───────────
  const search = searchParams.get('q') ?? '';
  const roleFilter = (searchParams.get('role') as Role | 'all' | null) ?? 'all';

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSearch = React.useCallback(
    (v: string) => updateUrlParams({ q: v }),
    [updateUrlParams],
  );
  const setRoleFilter = React.useCallback(
    (v: Role | 'all') => updateUrlParams({ role: v }),
    [updateUrlParams],
  );

  // ── Filtered (derived) ────────────────────────────────────────────────────
  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return optimisticUsers.filter((u) => {
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || (u.role ?? 'user') === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [optimisticUsers, search, roleFilter]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const handleRoleChange = React.useCallback(
    async (userId: string, newRole: Role) => {
      // Optimistic update (UI immediato), poi sync server via refresh
      React.startTransition(() => {
        applyOptimisticUsers({ userId, role: newRole });
      });
      const { error: err } = await admin.setRole({ userId, role: newRole });
      if (err) {
        setError(err.message ?? 'Errore cambio ruolo.');
        // refresh ripristina lo stato server (cancella l'optimistic)
        refresh();
        return;
      }
      refresh();
    },
    [applyOptimisticUsers, refresh],
  );

  const handleImpersonate = React.useCallback(async (userId: string) => {
    setActionsDialog(null);
    setImpersonatingId(userId);
    setError(null);
    const { error: err } = await admin.impersonateUser({ userId });
    if (err) {
      setError(err.message ?? 'Errore impersonate.');
      setImpersonatingId(null);
      return;
    }
    window.location.href = '/dashboard';
  }, []);

  const handleRevokeSessions = React.useCallback(async (userId: string) => {
    setActionsDialog(null);
    const { error: err } = await admin.revokeUserSessions({ userId });
    if (err) setError(err.message ?? 'Errore revoca sessioni.');
  }, []);

  const handleBan = React.useCallback(
    async (u: AdminUser) => {
      setActionsDialog(null);
      const { error: err } = await admin.banUser({
        userId: u.id,
        banReason: 'Bannato da admin',
        banExpiresIn: 60 * 60 * 24 * 30,
      });
      if (err) setError(err.message ?? 'Errore ban.');
      else refresh();
    },
    [refresh],
  );

  const handleUnban = React.useCallback(
    async (u: AdminUser) => {
      setActionsDialog(null);
      const { error: err } = await admin.unbanUser({ userId: u.id });
      if (err) setError(err.message ?? 'Errore unban.');
      else refresh();
    },
    [refresh],
  );

  const handleDelete = React.useCallback(async () => {
    if (!deleteDialog) return;
    setDeletePending(true);
    const { error: err } = await admin.removeUser({ userId: deleteDialog.id });
    setDeletePending(false);
    if (err) {
      setError(err.message ?? 'Errore eliminazione.');
      return;
    }
    setDeleteDialog(null);
    setDeleteConfirmText('');
    refresh();
  }, [deleteDialog, refresh]);

  const value = React.useMemo<UsersAdminContextValue>(
    () => ({
      currentUserId,
      users: optimisticUsers,
      filteredUsers,
      refresh,
      refreshing,
      error,
      clearError: () => setError(null),
      search,
      setSearch,
      roleFilter,
      setRoleFilter,
      actionsDialog,
      openActionsDialog: (u) => setActionsDialog(u),
      closeActionsDialog: () => setActionsDialog(null),
      deleteDialog,
      openDeleteDialog: (u) => {
        setDeleteDialog(u);
        setActionsDialog(null);
      },
      closeDeleteDialog: () => {
        setDeleteDialog(null);
        setDeleteConfirmText('');
      },
      deleteConfirmText,
      setDeleteConfirmText,
      deletePending,
      impersonatingId,
      handleRoleChange,
      handleImpersonate,
      handleRevokeSessions,
      handleBan,
      handleUnban,
      handleDelete,
    }),
    [
      currentUserId,
      optimisticUsers,
      filteredUsers,
      refresh,
      refreshing,
      error,
      search,
      setSearch,
      roleFilter,
      setRoleFilter,
      actionsDialog,
      deleteDialog,
      deleteConfirmText,
      deletePending,
      impersonatingId,
      handleRoleChange,
      handleImpersonate,
      handleRevokeSessions,
      handleBan,
      handleUnban,
      handleDelete,
    ],
  );

  return <UsersAdminContext.Provider value={value}>{children}</UsersAdminContext.Provider>;
}
