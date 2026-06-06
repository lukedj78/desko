'use client';

import { Alert } from '@desko/ui/components/alert';

import { ActionsDialog } from './actions-dialog';
import { UsersAdminProvider, useUsersAdmin } from './context';
import { DeleteDialog } from './delete-dialog';
import { Filters } from './filters';
import { Header } from './header';
import { Table } from './table';
import type { AdminUser } from './types';

type UsersAdminClientProps = {
  currentUserId: string;
  /** Lista iniziale fetchata server-side (data-fetching skill). */
  initialUsers: AdminUser[];
  /** Errore iniziale (es. listUsers fallita lato server). */
  initialError?: string | null;
};

/**
 * UsersAdminClient — pannello admin con tabella utenti + azioni (impersona,
 * banna, revoca sessioni, elimina).
 *
 * Architettura data-fetching skill compliant:
 * - `initialUsers` fetchato server-side (page.tsx → auth.api.listUsers)
 * - filtri sincronizzati con URL searchParams (q + role)
 * - mutations chiamano `router.refresh()` per re-render server (no useEffect)
 * - role change usa `useOptimistic` per UI snappiness
 *
 * Sub-components esposti come dot-properties per consentire ricomposizione:
 *
 *   <UsersAdminClient currentUserId={id} initialUsers={users} />
 *
 *   // oppure custom layout:
 *   <UsersAdminClient.Provider currentUserId={id} initialUsers={users}>
 *     <UsersAdminClient.Header />
 *     <UsersAdminClient.Filters />
 *     <UsersAdminClient.Table />
 *     <UsersAdminClient.ActionsDialog />
 *     <UsersAdminClient.DeleteDialog />
 *   </UsersAdminClient.Provider>
 */
export function UsersAdminClient({
  currentUserId,
  initialUsers,
  initialError = null,
}: UsersAdminClientProps) {
  return (
    <UsersAdminProvider
      currentUserId={currentUserId}
      initialUsers={initialUsers}
      initialError={initialError}
    >
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
