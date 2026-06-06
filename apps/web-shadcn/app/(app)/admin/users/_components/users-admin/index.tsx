'use client';

import { Alert } from '@desko/ui/components/alert';

import { ActionsDialog } from './actions-dialog';
import { UsersAdminProvider, useUsersAdmin } from './context';
import { DeleteDialog } from './delete-dialog';
import { Filters } from './filters';
import { Header } from './header';
import { Table } from './table';

/**
 * UsersAdminClient — pannello admin con tabella utenti + azioni (impersona,
 * banna, revoca sessioni, elimina).
 *
 * Pattern compound + Context: tutte le parti (Header, Filters, Table,
 * ActionsDialog, DeleteDialog) leggono stato e handlers dal
 * <UsersAdminProvider> via `useUsersAdmin()`. La pagina consumer monta solo
 * `<UsersAdminClient currentUserId>` e ottiene il pannello completo.
 *
 * Sub-components esposti come dot-properties per consentire ricomposizione:
 *
 *   import { UsersAdminClient } from './users-admin';
 *
 *   <UsersAdminClient currentUserId={id} />          // composizione default
 *
 *   // oppure custom layout:
 *   <UsersAdminClient.Provider currentUserId={id}>
 *     <UsersAdminClient.Header />
 *     <UsersAdminClient.Filters />
 *     <UsersAdminClient.Table />
 *     <UsersAdminClient.ActionsDialog />
 *     <UsersAdminClient.DeleteDialog />
 *   </UsersAdminClient.Provider>
 */
export function UsersAdminClient({ currentUserId }: { currentUserId: string }) {
  return (
    <UsersAdminProvider currentUserId={currentUserId}>
      <div className="mx-auto w-full max-w-screen-2xl px-5 py-8 sm:px-6 md:px-8 md:py-12">
        <div className="flex flex-col gap-6">
          <Header />
          <ErrorBanner />
          <Filters />
          <Table />
        </div>
        <ActionsDialog />
        <DeleteDialog />
      </div>
    </UsersAdminProvider>
  );
}

// Compound API — espone le parti per ricomposizione custom
UsersAdminClient.Provider = UsersAdminProvider;
UsersAdminClient.Header = Header;
UsersAdminClient.Filters = Filters;
UsersAdminClient.Table = Table;
UsersAdminClient.ActionsDialog = ActionsDialog;
UsersAdminClient.DeleteDialog = DeleteDialog;
UsersAdminClient.ErrorBanner = ErrorBanner;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper — banner errori (lo metto qui perché triviale, non vale
// un file separato)
// ─────────────────────────────────────────────────────────────────────────────
function ErrorBanner() {
  const { error, clearError } = useUsersAdmin();
  if (!error) return null;
  return (
    <Alert variant="destructive" onClick={clearError} className="cursor-pointer">
      {error}
    </Alert>
  );
}
