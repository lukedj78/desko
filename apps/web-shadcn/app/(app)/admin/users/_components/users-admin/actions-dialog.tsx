'use client';

import { Ban, CheckCircle2, ShieldOff, Trash2, UserRoundCog } from 'lucide-react';

import { Avatar, AvatarFallback } from '@desko/ui/components/avatar';
import { Button } from '@desko/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@desko/ui/components/dialog';

import { useUsersAdmin } from './context';
import { initialsFromName } from './types';

export function ActionsDialog() {
  const {
    actionsDialog,
    closeActionsDialog,
    currentUserId,
    handleImpersonate,
    handleRevokeSessions,
    handleBan,
    handleUnban,
    openDeleteDialog,
  } = useUsersAdmin();

  return (
    <Dialog open={!!actionsDialog} onOpenChange={(o) => !o && closeActionsDialog()}>
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
              {/* Impersona */}
              <ActionRow
                icon={<UserRoundCog className="size-4" />}
                title="Impersona"
                description={
                  actionsDialog.id === currentUserId
                    ? 'Non puoi impersonare te stesso'
                    : actionsDialog.banned
                      ? "L'utente è bannato"
                      : "Vedi l'app come questo utente"
                }
                disabled={actionsDialog.id === currentUserId || !!actionsDialog.banned}
                onClick={() => handleImpersonate(actionsDialog.id)}
              />

              {/* Revoca sessioni */}
              <ActionRow
                icon={<ShieldOff className="size-4" />}
                title="Revoca sessioni"
                description="Forza il logout su tutti i dispositivi"
                onClick={() => handleRevokeSessions(actionsDialog.id)}
              />

              {/* Ban / Unban */}
              {actionsDialog.banned ? (
                <ActionRow
                  icon={<CheckCircle2 className="size-4" />}
                  title="Sblocca utente"
                  description="Ripristina l'accesso"
                  tone="success"
                  onClick={() => handleUnban(actionsDialog)}
                />
              ) : (
                <ActionRow
                  icon={<Ban className="size-4" />}
                  title="Banna utente"
                  description="Blocca l'accesso per 30 giorni"
                  tone="warning"
                  disabled={actionsDialog.id === currentUserId}
                  onClick={() => handleBan(actionsDialog)}
                />
              )}

              {/* Delete */}
              <ActionRow
                icon={<Trash2 className="size-4" />}
                title="Elimina utente"
                description="Cancellazione permanente — dipendente non più in azienda"
                tone="destructive"
                disabled={actionsDialog.id === currentUserId}
                onClick={() => openDeleteDialog(actionsDialog)}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={closeActionsDialog}>
                Chiudi
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActionRow (helper inline — 1 azione del menu dialog)
// ─────────────────────────────────────────────────────────────────────────────
type ActionTone = 'default' | 'success' | 'warning' | 'destructive';

const TONE_CLASSES: Record<ActionTone, string> = {
  default: 'hover:bg-muted',
  success: 'text-success hover:bg-success/10',
  warning: 'text-warning hover:bg-warning/10',
  destructive: 'text-destructive hover:bg-destructive/10',
};

function ActionRow({
  icon,
  title,
  description,
  tone = 'default',
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: ActionTone;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-left disabled:opacity-50 disabled:cursor-not-allowed ${TONE_CLASSES[tone]}`}
    >
      {icon}
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
