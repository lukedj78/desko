'use client';

import { Loader2, MoreVertical } from 'lucide-react';

import { Avatar, AvatarFallback } from '@desko/ui/components/avatar';
import { Badge } from '@desko/ui/components/badge';
import { Button } from '@desko/ui/components/button';
import { Card } from '@desko/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@desko/ui/components/select';

import { useUsersAdmin } from './context';
import { ROLE_OPTIONS, type AdminUser, type Role, formatDate, initialsFromName } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Table (Card wrapper + states + tbody)
// ─────────────────────────────────────────────────────────────────────────────
export function Table() {
  const { users } = useUsersAdmin();

  // Loading non esiste più: i dati arrivano dal Server Component al render
  // iniziale, refresh usa router.refresh() che mostra lo spinner sul button
  // header (non sulla tabella, che resta interattiva).
  return (
    <Card className="overflow-hidden">
      {users.length === 0 ? <EmptyState /> : <UsersTable />}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <p className="font-semibold">Nessun utente</p>
      <p className="text-sm text-muted-foreground mt-1">
        Esegui <code className="font-mono">pnpm db:seed</code> per creare il super admin.
      </p>
    </div>
  );
}

function UsersTable() {
  const { filteredUsers } = useUsersAdmin();
  return (
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
          {filteredUsers.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserRow (inline — tightly coupled to Table semantica HTML)
// ─────────────────────────────────────────────────────────────────────────────
function UserRow({ user }: { user: AdminUser }) {
  const { handleRoleChange, impersonatingId, openActionsDialog } = useUsersAdmin();
  const role = (user.role ?? 'user') as Role;
  const isBanned = !!user.banned;

  return (
    <tr className="border-b border-border hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 ring-2 ring-primary">
            <AvatarFallback className="bg-muted text-xs font-bold">
              {initialsFromName(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {user.id.slice(0, 8)}…
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Select
          value={role}
          onValueChange={(v) => v && void handleRoleChange(user.id, v as Role)}
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
        ) : user.emailVerified ? (
          <Badge variant="success">Attivo</Badge>
        ) : (
          <Badge variant="outline-dashed">Email non verificata</Badge>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Azioni per ${user.name}`}
          disabled={impersonatingId === user.id}
          onClick={() => openActionsDialog(user)}
        >
          {impersonatingId === user.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreVertical className="size-4" />
          )}
        </Button>
      </td>
    </tr>
  );
}
