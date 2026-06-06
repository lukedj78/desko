export type Role = 'user' | 'admin' | 'hr_analytics';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  emailVerified?: boolean;
  createdAt: string | Date;
};

export const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'user', label: 'Utente' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr_analytics', label: 'HR Analytics' },
];

export const ROLE_FILTER_OPTIONS: Array<{ value: Role | 'all'; label: string }> = [
  { value: 'all', label: 'Tutti i ruoli' },
  ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label })),
];

export const formatDate = (d: string | Date | null | undefined): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(date);
};

export const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};
