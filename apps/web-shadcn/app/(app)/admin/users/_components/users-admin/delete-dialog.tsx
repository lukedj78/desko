'use client';

import { Loader2, Trash2 } from 'lucide-react';

import { Alert } from '@desko/ui/components/alert';
import { Button } from '@desko/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@desko/ui/components/dialog';
import { Field } from '@desko/ui/components/field';

import { useUsersAdmin } from './context';

export function DeleteDialog() {
  const {
    deleteDialog,
    closeDeleteDialog,
    deleteConfirmText,
    setDeleteConfirmText,
    deletePending,
    handleDelete,
  } = useUsersAdmin();

  return (
    <Dialog
      open={!!deleteDialog}
      onOpenChange={(o) => {
        if (!o && !deletePending) closeDeleteDialog();
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
              <Button variant="ghost" disabled={deletePending} onClick={closeDeleteDialog}>
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
  );
}
