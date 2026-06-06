'use client';

import * as React from 'react';

import { admin } from '@/lib/auth-client';

import type { AdminUser, Role } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────
type UsersAdminContextValue = {
  // Identity
  currentUserId: string;

  // Data
  users: AdminUser[];
  filteredUsers: AdminUser[];
  loading: boolean;
  error: string | null;
  clearError: () => void;

  // Filters
  search: string;
  setSearch: (v: string) => void;
  roleFilter: Role | 'all';
  setRoleFilter: (v: Role | 'all') => void;

  // Modals
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

  // Actions
  fetchUsers: () => Promise<void>;
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
  children: React.ReactNode;
};

export function UsersAdminProvider({ currentUserId, children }: ProviderProps) {
  // Data
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<Role | 'all'>('all');

  // Modals
  const [actionsDialog, setActionsDialog] = React.useState<AdminUser | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<AdminUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [deletePending, setDeletePending] = React.useState(false);

  // Impersonation transition
  const [impersonatingId, setImpersonatingId] = React.useState<string | null>(null);

  // ── Actions ───────────────────────────────────────────────────────────────
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await admin.listUsers({
        query: { limit: 100, sortBy: 'createdAt', sortDirection: 'desc' },
      });
      if (result.error) {
        setError(result.error.message ?? 'Impossibile caricare gli utenti.');
      } else {
        setUsers((result.data?.users ?? []) as AdminUser[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = React.useCallback(
    async (userId: string, newRole: Role) => {
      const previous = users.find((u) => u.id === userId)?.role;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      const { error: err } = await admin.setRole({ userId, role: newRole });
      if (err) {
        setError(err.message ?? 'Errore cambio ruolo.');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: previous as string } : u)),
        );
      }
    },
    [users],
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
      else void fetchUsers();
    },
    [fetchUsers],
  );

  const handleUnban = React.useCallback(
    async (u: AdminUser) => {
      setActionsDialog(null);
      const { error: err } = await admin.unbanUser({ userId: u.id });
      if (err) setError(err.message ?? 'Errore unban.');
      else void fetchUsers();
    },
    [fetchUsers],
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
    void fetchUsers();
  }, [deleteDialog, fetchUsers]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || (u.role ?? 'user') === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const value = React.useMemo<UsersAdminContextValue>(
    () => ({
      currentUserId,
      users,
      filteredUsers,
      loading,
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
      fetchUsers,
      handleRoleChange,
      handleImpersonate,
      handleRevokeSessions,
      handleBan,
      handleUnban,
      handleDelete,
    }),
    [
      currentUserId,
      users,
      filteredUsers,
      loading,
      error,
      search,
      roleFilter,
      actionsDialog,
      deleteDialog,
      deleteConfirmText,
      deletePending,
      impersonatingId,
      fetchUsers,
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
