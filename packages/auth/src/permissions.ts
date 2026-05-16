import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements,
  adminAc,
  userAc,
} from 'better-auth/plugins/admin/access';

/**
 * Access Control per Desko — 3 ruoli con statement permissions granulari.
 *
 * Pattern better-auth: ogni "statement" è una risorsa con un set di azioni.
 * Ogni ruolo ottiene un sottoinsieme delle azioni di ogni risorsa.
 *
 *   admin       → full control (gestione utenti + impersonate + ban + tutto HR)
 *   hr_analytics → read-only su HR aggregato (US-6) + lista users (no actions)
 *   user        → default (solo proprie presenze, follow, profilo)
 *
 * Uso (server):
 *   await requireRole(['admin', 'hr_analytics']);  // gate route /admin/analytics
 *   await requirePermission({ hr: ['view-aggregate'] });  // gate fine-grained
 *
 * Uso (client):
 *   const { data: hasAccess } = authClient.admin.hasPermission({
 *     permissions: { hr: ['view-aggregate'] }
 *   });
 *
 * Doc: https://www.better-auth.com/docs/plugins/admin#access-control
 */

const statement = {
  // Estendiamo il default statement di better-auth admin (user + session)
  ...defaultStatements,
  // Risorse Desko-specifiche
  hr: ['view-aggregate', 'export-csv'],
  presence: ['view-all', 'override-others'],
} as const;

export const ac = createAccessControl(statement);

/** Ruolo `user` — default: nessun permesso admin/hr/presence */
export const userRole = ac.newRole({
  ...userAc.statements,
});

/** Ruolo `admin` — controllo totale su utenti, sessioni, HR aggregati */
export const adminRole = ac.newRole({
  ...adminAc.statements,
  hr: ['view-aggregate', 'export-csv'],
  presence: ['view-all', 'override-others'],
});

/** Ruolo `hr_analytics` — read-only su HR aggregato + list users (no mutations) */
export const hrAnalyticsRole = ac.newRole({
  user: ['list'],
  hr: ['view-aggregate', 'export-csv'],
});

export const ROLES = {
  user: userRole,
  admin: adminRole,
  hr_analytics: hrAnalyticsRole,
} as const;

export type AppRole = keyof typeof ROLES;
