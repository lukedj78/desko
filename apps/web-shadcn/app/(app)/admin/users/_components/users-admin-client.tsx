'use client';

import {
  Ban,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
  UserRoundCog,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { admin } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type Role = 'user' | 'admin' | 'hr_analytics';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  emailVerified?: boolean;
  createdAt: string | Date;
};

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'user', label: 'Utente' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr_analytics', label: 'HR Analytics' },
];
const ROLE_FILTER_OPTIONS: Array<{ value: Role | 'all'; label: string }> = [
  { value: 'all', label: 'Tutti i ruoli' },
  ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label })),
];

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(date);
};

const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

export function UsersAdminClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const [actionsDialog, setActionsDialog] = useState<AdminUser | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AdminUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePending, setDeletePending] = useState(false);

  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || (u.role ?? 'user') === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const previous = users.find((u) => u.id === userId)?.role;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    const { error: err } = await admin.setRole({ userId, role: newRole });
    if (err) {
      setError(err.message ?? 'Errore cambio ruolo.');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: previous as string } : u)),
      );
    }
  };

  const handleImpersonate = async (userId: string) => {
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
  };

  const handleRevokeSessions = async (userId: string) => {
    setActionsDialog(null);
    const { error: err } = await admin.revokeUserSessions({ userId });
    if (err) setError(err.message ?? 'Errore revoca sessioni.');
  };

  const handleBan = async (u: AdminUser) => {
    setActionsDialog(null);
    const { error: err } = await admin.banUser({
      userId: u.id,
      banReason: 'Bannato da admin',
      banExpiresIn: 60 * 60 * 24 * 30,
    });
    if (err) setError(err.message ?? 'Errore ban.');
    else void fetchUsers();
  };

  const handleUnban = async (u: AdminUser) => {
    setActionsDialog(null);
    const { error: err } = await admin.unbanUser({ userId: u.id });
    if (err) setError(err.message ?? 'Errore unban.');
    else void fetchUsers();
  };

  const handleDelete = async () => {
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
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Admin · gestione utenti</Eyebrow>
            <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
              Utenti e ruoli.
            </h1>
            <p className="text-base text-muted-foreground">
              Crea, assegna ruoli, banna, revoca sessioni o impersona utenti.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void fetchUsers()}
              disabled={loading}
              aria-label="Aggiorna lista"
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </Button>
            <Button>
              <Plus className="size-4" />
              Nuovo utente
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" onClick={() => setError(null)} className="cursor-pointer">
            {error}
          </Alert>
        ) : null}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Cerca per nome o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap px-2">
            {filteredUsers.length} di {users.length}
          </span>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-3">Caricamento utenti…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold">Nessun utente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Esegui <code className="font-mono">pnpm db:seed</code> per creare il super admin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Utente</th>
                    <th className="text-left font-semibold px-4 py-3">Ruolo</th>
                    <th className="text-left font-semibold px-4 py-3">Stato</th>
                    <th className="text-left font-semibold px-4 py-3">Email</th>
                    <th className="text-left font-semibold px-4 py-3">Creato</th>
                    <th className="text-right font-semibold px-4 py-3">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nessun utente corrisponde ai filtri.
                      </td>
                    </tr>
                  ) : null}
                  {filteredUsers.map((u) => {
                    const role = (u.role ?? 'user') as Role;
                    const isBanned = !!u.banned;
                    return (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 ring-2 ring-primary">
                              <AvatarFallback className="bg-muted text-xs font-bold">
                                {initialsFromName(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate font-mono">
                                {u.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={role}
                            onValueChange={(v) => void handleRoleChange(u.id, v as Role)}
                          >
                            <SelectTrigger className="h-9 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          {isBanned ? (
                            <Badge variant="destructive">Bannato</Badge>
                          ) : u.emailVerified ? (
                            <Badge variant="success">Attivo</Badge>
                          ) : (
                            <Badge variant="outline-dashed">Email non verificata</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Azioni per ${u.name}`}
                            disabled={impersonatingId === u.id}
                            onClick={() => setActionsDialog(u)}
                          >
                            {impersonatingId === u.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MoreVertical className="size-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Actions Dialog */}
      <Dialog open={!!actionsDialog} onOpenChange={(o) => !o && setActionsDialog(null)}>
        <DialogContent>
          {actionsDialog ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 ring-2 ring-primary">
                    <AvatarFallback className="bg-muted text-xs font-bold">
                      {initialsFromName(actionsDialog.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <DialogTitle>{actionsDialog.name}</DialogTitle>
                    <DialogDescription className="font-mono text-xs">
                      {actionsDialog.email}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-1">
                <button
                  disabled={actionsDialog.id === currentUserId || !!actionsDialog.banned}
                  onClick={() => handleImpersonate(actionsDialog.id)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserRoundCog className="size-4" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Impersona</p>
                    <p className="text-xs text-muted-foreground">
                      {actionsDialog.id === currentUserId
                        ? 'Non puoi impersonare te stesso'
                        : actionsDialog.banned
                        ? "L'utente è bannato"
                        : "Vedi l'app come questo utente"}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleRevokeSessions(actionsDialog.id)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                >
                  <ShieldOff className="size-4" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Revoca sessioni</p>
                    <p className="text-xs text-muted-foreground">
                      Forza il logout su tutti i dispositivi
                    </p>
                  </div>
                </button>
                {actionsDialog.banned ? (
                  <button
                    onClick={() => handleUnban(actionsDialog)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-success hover:bg-success/10"
                  >
                    <CheckCircle2 className="size-4" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Sblocca utente</p>
                      <p className="text-xs text-muted-foreground">Ripristina l&apos;accesso</p>
                    </div>
                  </button>
                ) : (
                  <button
                    disabled={actionsDialog.id === currentUserId}
                    onClick={() => handleBan(actionsDialog)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-warning hover:bg-warning/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban className="size-4" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Banna utente</p>
                      <p className="text-xs text-muted-foreground">
                        Blocca l&apos;accesso per 30 giorni
                      </p>
                    </div>
                  </button>
                )}
                <button
                  disabled={actionsDialog.id === currentUserId}
                  onClick={() => {
                    setDeleteDialog(actionsDialog);
                    setActionsDialog(null);
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-4" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Elimina utente</p>
                    <p className="text-xs text-muted-foreground">
                      Cancellazione permanente — dipendente non più in azienda
                    </p>
                  </div>
                </button>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setActionsDialog(null)}>
                  Chiudi
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteDialog}
        onOpenChange={(o) => {
          if (!o && !deletePending) {
            setDeleteDialog(null);
            setDeleteConfirmText('');
          }
        }}
      >
        <DialogContent>
          {deleteDialog ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  Eliminare {deleteDialog.name}?
                </DialogTitle>
              </DialogHeader>
              <Alert variant="destructive">
                Azione <strong>permanente</strong>: account, sessioni, presenze, follow,
                pattern verranno eliminati.
              </Alert>
              <p className="text-sm text-muted-foreground">
                Per confermare, scrivi <strong>{deleteDialog.email}</strong> qui sotto:
              </p>
              <Field
                id="delete-confirm"
                label="Email utente"
                placeholder={deleteDialog.email}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoComplete="off"
              />
              <DialogFooter>
                <Button
                  variant="ghost"
                  disabled={deletePending}
                  onClick={() => {
                    setDeleteDialog(null);
                    setDeleteConfirmText('');
                  }}
                >
                  Annulla
                </Button>
                <Button
                  variant="destructive"
                  disabled={deletePending || deleteConfirmText.trim() !== deleteDialog.email}
                  onClick={() => void handleDelete()}
                >
                  {deletePending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Elimina definitivamente
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
