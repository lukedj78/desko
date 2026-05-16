'use client';

import AddIcon from '@mui/icons-material/Add';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwitchAccountOutlinedIcon from '@mui/icons-material/SwitchAccountOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Eyebrow } from '@/components/site/eyebrow';
import { Field } from '@/components/site/field';
import { admin } from '@/lib/auth-client';

type UsersAdminClientProps = {
  /** ID dell'admin loggato — escluso dalle azioni impersona/banna su se stesso. */
  currentUserId: string;
};

type Role = 'user' | 'admin' | 'hr_analytics';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | Date | null;
  emailVerified?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

const ROLE_OPTIONS: Array<{ value: Role; label: string; tone: string }> = [
  { value: 'user', label: 'Utente', tone: 'text.secondary' },
  { value: 'admin', label: 'Admin', tone: 'primary.dark' },
  { value: 'hr_analytics', label: 'HR Analytics', tone: 'info.main' },
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
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
};

export function UsersAdminClient({ currentUserId }: UsersAdminClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [actionsDialog, setActionsDialog] = useState<AdminUser | null>(null);

  const [banDialog, setBanDialog] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banPending, setBanPending] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<AdminUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePending, setDeletePending] = useState(false);

  // Filtered list — search by name/email + filter by role
  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || (u.role ?? 'user') === roleFilter;
    return matchesSearch && matchesRole;
  });

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
      setError(e instanceof Error ? e.message : 'Errore caricamento utenti.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const previous = users.find((u) => u.id === userId)?.role;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    const { error: err } = await admin.setRole({ userId, role: newRole });
    if (err) {
      setError(err.message ?? 'Errore cambio ruolo.');
      // rollback ottimistico
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: previous as string } : u)),
      );
    }
  };

  const handleBan = async () => {
    if (!banDialog) return;
    setBanPending(true);
    const { error: err } = await admin.banUser({
      userId: banDialog.id,
      banReason: banReason.trim() || 'Bannato da admin',
      banExpiresIn: 60 * 60 * 24 * 30, // 30 giorni
    });
    setBanPending(false);
    if (err) {
      setError(err.message ?? 'Errore ban.');
      return;
    }
    setBanDialog(null);
    setBanReason('');
    void fetchUsers();
  };

  const handleUnban = async (userId: string) => {
    const { error: err } = await admin.unbanUser({ userId });
    if (err) {
      setError(err.message ?? 'Errore unban.');
      return;
    }
    void fetchUsers();
  };

  const handleRevokeSessions = async (userId: string) => {
    const { error: err } = await admin.revokeUserSessions({ userId });
    if (err) {
      setError(err.message ?? 'Errore revoca sessioni.');
      return;
    }
    setError(null);
  };

  /**
   * Avvia l'impersonate: better-auth crea una nuova sessione per `userId`
   * con `impersonatedBy = adminId`. Il banner globale offrirà lo "Stop".
   * Dopo il successo navighiamo alla dashboard e refreshiamo per
   * rivalutare le RSC con la nuova session.
   */
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
    router.push('/dashboard');
    router.refresh();
  };

  /**
   * Eliminazione permanente dell'utente (per dipendenti che hanno lasciato l'azienda).
   * better-auth `admin.removeUser` elimina la riga `user` + cascata su `session`/`account`
   * (definito nello schema con `onDelete: 'cascade'`). Le `presence_entries` cascadano
   * anch'esse — è una cancellazione completa.
   */
  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeletePending(true);
    setError(null);
    const { error: err } = await admin.removeUser({ userId: deleteDialog.id });
    setDeletePending(false);
    if (err) {
      setError(err.message ?? 'Errore eliminazione utente.');
      return;
    }
    setDeleteDialog(null);
    setDeleteConfirmText('');
    void fetchUsers();
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const role = String(fd.get('role') ?? 'user') as Role;

    if (password.length < 8) {
      setCreateError('La password deve avere almeno 8 caratteri.');
      return;
    }

    setCreating(true);
    const { error: err } = await admin.createUser({
      name,
      email,
      password,
      role,
    });
    setCreating(false);
    if (err) {
      setCreateError(err.message ?? 'Creazione utente fallita.');
      return;
    }
    setCreateOpen(false);
    void fetchUsers();
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3, md: 4 } }}>
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Eyebrow>Admin · gestione utenti</Eyebrow>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 700,
                fontSize: { xs: 28, md: 36 },
                lineHeight: 1.1,
                letterSpacing: '-0.4px',
              }}
            >
              Utenti e ruoli.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Crea nuovi utenti, assegna ruoli (user / admin / HR analytics), banna account
              compromessi, revoca sessioni attive.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Tooltip title="Aggiorna lista">
              <IconButton onClick={() => void fetchUsers()} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="medium"
              onClick={() => setCreateOpen(true)}
            >
              Nuovo utente
            </Button>
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" variant="outlined" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {/* Filtri: search per nome/email + filtro ruolo */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Field
              id="users-search"
              label=""
              placeholder="Cerca per nome o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 220 } }}>
            <Field
              id="users-role-filter"
              label=""
              select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
              fullWidth
            >
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field>
          </Box>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', whiteSpace: 'nowrap', px: 1 }}
          >
            {filteredUsers.length} di {users.length}
          </Typography>
        </Stack>

        {/* Users table */}
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                Caricamento utenti…
              </Typography>
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Nessun utente
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Esegui <code>pnpm db:seed</code> per creare il super admin iniziale.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Utente</TableCell>
                    <TableCell>Ruolo</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Creato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Nessun utente corrisponde ai filtri.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredUsers.map((u) => {
                    const role = (u.role ?? 'user') as Role;
                    const isBanned = !!u.banned;
                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: 13,
                                fontWeight: 700,
                                bgcolor: 'background.default',
                                color: 'text.primary',
                                border: '1.5px solid',
                                borderColor: 'primary.main',
                              }}
                            >
                              {initialsFromName(u.name)}
                            </Avatar>
                            <Stack sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {u.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                {u.id.slice(0, 8)}…
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Field
                            id={`role-${u.id}`}
                            label=""
                            select
                            value={role}
                            onChange={(e) =>
                              void handleRoleChange(u.id, e.target.value as Role)
                            }
                            fullWidth={false}
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Field>
                        </TableCell>
                        <TableCell>
                          {isBanned ? (
                            <Chip
                              label="Bannato"
                              size="small"
                              sx={{
                                backgroundColor: 'error.main',
                                color: 'error.contrastText',
                                fontWeight: 600,
                              }}
                            />
                          ) : u.emailVerified ? (
                            <Chip
                              label="Attivo"
                              size="small"
                              sx={{
                                backgroundColor: 'success.main',
                                color: 'success.contrastText',
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Email non verificata"
                              size="small"
                              variant="outlined"
                              sx={{ borderStyle: 'dashed' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'var(--font-jetbrains)' }}
                            noWrap
                          >
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatDate(u.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Azioni">
                            <IconButton
                              size="small"
                              aria-label={`Azioni per ${u.name}`}
                              onClick={() => setActionsDialog(u)}
                              disabled={impersonatingId === u.id}
                            >
                              {impersonatingId === u.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <MoreVertIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Stack>

      {/* Dialog azioni utente — entry point per impersona/revoca/banna/elimina */}
      <Dialog
        open={!!actionsDialog}
        onClose={() => setActionsDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        {actionsDialog ? (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    fontSize: 13,
                    fontWeight: 700,
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    border: '1.5px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  {initialsFromName(actionsDialog.name)}
                </Avatar>
                <Stack sx={{ minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                    {actionsDialog.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
                    noWrap
                  >
                    {actionsDialog.email}
                  </Typography>
                </Stack>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 0, px: 1, pb: 1 }}>
              <List sx={{ py: 0 }}>
                <ListItemButton
                  disabled={
                    actionsDialog.id === currentUserId || !!actionsDialog.banned
                  }
                  onClick={() => void handleImpersonate(actionsDialog.id)}
                  sx={{ borderRadius: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SwitchAccountOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Impersona"
                    secondary={
                      actionsDialog.id === currentUserId
                        ? 'Non puoi impersonare te stesso'
                        : actionsDialog.banned
                        ? "L'utente è bannato"
                        : "Vedi l'app come questo utente"
                    }
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>

                <ListItemButton
                  onClick={() => {
                    setActionsDialog(null);
                    void handleRevokeSessions(actionsDialog.id);
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LockResetOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Revoca sessioni"
                    secondary="Forza il logout su tutti i dispositivi"
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>

                {actionsDialog.banned ? (
                  <ListItemButton
                    onClick={() => {
                      const target = actionsDialog;
                      setActionsDialog(null);
                      void handleUnban(target.id);
                    }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircleOutlineIcon
                        fontSize="small"
                        sx={{ color: 'success.main' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sblocca utente"
                      secondary="Ripristina l'accesso"
                      primaryTypographyProps={{ fontWeight: 600, color: 'success.main' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                ) : (
                  <ListItemButton
                    disabled={actionsDialog.id === currentUserId}
                    onClick={() => {
                      setBanDialog(actionsDialog);
                      setActionsDialog(null);
                    }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <BlockOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Banna utente"
                      secondary={
                        actionsDialog.id === currentUserId
                          ? 'Non puoi bannare te stesso'
                          : "Blocca l'accesso per 30 giorni"
                      }
                      primaryTypographyProps={{ fontWeight: 600, color: 'warning.main' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                )}

                <ListItemButton
                  disabled={actionsDialog.id === currentUserId}
                  onClick={() => {
                    setDeleteDialog(actionsDialog);
                    setActionsDialog(null);
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DeleteForeverOutlinedIcon
                      fontSize="small"
                      sx={{ color: 'error.main' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Elimina utente"
                    secondary={
                      actionsDialog.id === currentUserId
                        ? 'Non puoi eliminare te stesso'
                        : 'Cancellazione permanente — dipendente non più in azienda'
                    }
                    primaryTypographyProps={{ fontWeight: 600, color: 'error.main' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              </List>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setActionsDialog(null)} variant="text">
                Chiudi
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Dialog conferma eliminazione utente */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => {
          if (!deletePending) {
            setDeleteDialog(null);
            setDeleteConfirmText('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Eliminare {deleteDialog?.name}?
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Alert severity="error" variant="outlined">
              Questa azione è <strong>permanente</strong> e non può essere annullata. Verranno
              eliminati: account, sessioni attive, presenze dichiarate, follow, pattern
              settimanali. Da usare solo quando il dipendente non è più in azienda.
            </Alert>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Per confermare, scrivi <strong>{deleteDialog?.email}</strong> qui sotto:
            </Typography>
            <Field
              id="delete-confirm"
              label="Email utente"
              placeholder={deleteDialog?.email}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setDeleteDialog(null);
              setDeleteConfirmText('');
            }}
            variant="text"
            disabled={deletePending}
          >
            Annulla
          </Button>
          <Button
            onClick={() => void handleDelete()}
            variant="contained"
            color="error"
            disabled={deletePending || deleteConfirmText.trim() !== deleteDialog?.email}
            startIcon={
              deletePending ? <CircularProgress size={16} /> : <DeleteForeverOutlinedIcon />
            }
          >
            Elimina definitivamente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog crea utente */}
      <Dialog
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Crea nuovo utente</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent>
            <Stack spacing={2.5}>
              {createError ? <Alert severity="error">{createError}</Alert> : null}
              <Field id="create-name" name="name" label="Nome completo" required />
              <Field id="create-email" name="email" type="email" label="Email" required />
              <Field
                id="create-password"
                name="password"
                type="password"
                label="Password iniziale"
                required
                helperText="Almeno 8 caratteri. L'utente la cambierà al primo accesso."
              />
              <Field id="create-role" name="role" label="Ruolo" select defaultValue="user">
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateOpen(false)} variant="text" disabled={creating}>
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating}
              startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
            >
              Crea utente
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog ban */}
      <Dialog
        open={!!banDialog}
        onClose={() => !banPending && setBanDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Banna {banDialog?.name}?
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              L&apos;utente non potrà accedere per 30 giorni. Le sessioni attive verranno
              automaticamente revocate.
            </Typography>
            <Field
              id="ban-reason"
              label="Motivo (visibile nei log)"
              placeholder="Es. account compromesso, comportamento inappropriato"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              optional
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setBanDialog(null)}
            variant="text"
            disabled={banPending}
          >
            Annulla
          </Button>
          <Button
            onClick={() => void handleBan()}
            variant="contained"
            color="error"
            disabled={banPending}
            startIcon={banPending ? <CircularProgress size={16} /> : <BlockOutlinedIcon />}
          >
            Banna utente
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
