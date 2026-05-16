'use client';

import AddIcon from '@mui/icons-material/Add';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Field } from '@/components/site/field';
import { addRestaurant, createLunchProposal } from '@/lib/server/lunch';
import type { RestaurantWithRating } from '@/lib/queries/lunch';

type InvitableUser = {
  userId: string;
  displayName: string;
  email: string;
  initials: string;
  team: string | null;
};

type Props = {
  restaurants: RestaurantWithRating[];
  invitableUsers: InvitableUser[];
};

const CUISINE_OPTIONS = [
  { value: 'italian', label: 'Italiana' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'asian', label: 'Asiatica' },
  { value: 'salad', label: 'Insalate' },
  { value: 'burger', label: 'Burger' },
  { value: 'bistro', label: 'Bistrot' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'fusion', label: 'Fusion' },
  { value: 'other', label: 'Altro' },
] as const;

const PRICE_OPTIONS = ['€', '€€', '€€€'] as const;

const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function CreateProposalButton({ restaurants, invitableUsers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Form state
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [date, setDate] = useState<string>(isoToday());
  const [meetingTime, setMeetingTime] = useState<string>('13:00');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [note, setNote] = useState<string>('');
  const [invitees, setInvitees] = useState<InvitableUser[]>([]);

  // Add restaurant inline
  const [addingRestaurant, setAddingRestaurant] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine: 'other' as (typeof CUISINE_OPTIONS)[number]['value'],
    priceRange: '€€' as (typeof PRICE_OPTIONS)[number],
    address: '',
    emoji: '',
    description: '',
  });

  const reset = () => {
    setRestaurantId('');
    setDate(isoToday());
    setMeetingTime('13:00');
    setVisibility('public');
    setNote('');
    setInvitees([]);
    setError(null);
    setAddingRestaurant(false);
    setNewRestaurant({
      name: '',
      cuisine: 'other',
      priceRange: '€€',
      address: '',
      emoji: '',
      description: '',
    });
  };

  const handleClose = () => {
    if (pending) return;
    setOpen(false);
    reset();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!restaurantId) {
      setError('Scegli un ristorante o aggiungine uno nuovo.');
      return;
    }
    if (visibility === 'private' && invitees.length === 0) {
      setError('Una proposta privata deve avere almeno un invitato.');
      return;
    }
    startTransition(async () => {
      const res = await createLunchProposal({
        restaurantId,
        date,
        meetingTime,
        visibility,
        note: note.trim() || undefined,
        inviteUserIds: visibility === 'private' ? invitees.map((u) => u.userId) : [],
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  const handleAddRestaurant = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newRestaurant.name.trim() || !newRestaurant.address.trim()) {
      setError('Inserisci nome e indirizzo del ristorante.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addRestaurant({
        name: newRestaurant.name,
        cuisine: newRestaurant.cuisine,
        priceRange: newRestaurant.priceRange,
        address: newRestaurant.address,
        emoji: newRestaurant.emoji || undefined,
        description: newRestaurant.description || undefined,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      // Aggiungi al volo all'autocomplete: il prossimo refresh lo carica;
      // intanto seleziono via id ritornato.
      setRestaurantId(res.data.restaurantId);
      setAddingRestaurant(false);
      router.refresh();
    });
  };

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        size="medium"
        onClick={() => setOpen(true)}
        sx={{ flexShrink: 0 }}
      >
        Crea proposta
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nuova proposta di pranzo</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2.5}>
              {error ? (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              ) : null}

              {/* Ristorante */}
              {!addingRestaurant ? (
                <Stack spacing={1}>
                  <Stack spacing={1}>
                    <Typography
                      component="label"
                      htmlFor="proposal-restaurant"
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'text.primary',
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 1,
                      }}
                    >
                      Ristorante
                      <Typography component="span" sx={{ color: 'error.main', fontSize: 14 }}>
                        *
                      </Typography>
                    </Typography>
                    <Autocomplete
                      id="proposal-restaurant"
                      options={restaurants}
                      value={selectedRestaurant ?? null}
                      onChange={(_, newValue) =>
                        setRestaurantId(newValue?.id ?? '')
                      }
                      getOptionLabel={(opt) => opt.name}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Cerca tra i ristoranti…"
                          required
                          size="medium"
                        />
                      )}
                    renderOption={(props, opt) => (
                      <li {...props} key={opt.id}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          sx={{ width: '100%' }}
                        >
                          <Box sx={{ fontSize: 18 }}>{opt.emoji ?? '🍽️'}</Box>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {opt.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary' }}
                              noWrap
                            >
                              {opt.address}
                              {opt.distanceM ? ` · ~${opt.distanceM}m` : ''}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'var(--font-jetbrains)',
                              fontWeight: 700,
                              color: 'text.secondary',
                            }}
                          >
                            {opt.priceRange}
                          </Typography>
                        </Stack>
                      </li>
                    )}
                  />
                  </Stack>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setAddingRestaurant(true)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    + Aggiungi un nuovo ristorante
                  </Button>
                </Stack>
              ) : (
                <Stack
                  spacing={1.5}
                  sx={{
                    p: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Nuovo ristorante
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setAddingRestaurant(false)}
                    >
                      Annulla
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Field
                      id="new-rest-emoji"
                      label="Emoji"
                      value={newRestaurant.emoji}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, emoji: e.target.value })
                      }
                      placeholder="🍕"
                      sx={{ width: 80 }}
                      optional
                    />
                    <Field
                      id="new-rest-name"
                      label="Nome"
                      required
                      value={newRestaurant.name}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, name: e.target.value })
                      }
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                  <Field
                    id="new-rest-address"
                    label="Indirizzo"
                    required
                    value={newRestaurant.address}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, address: e.target.value })
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <Field
                      id="new-rest-cuisine"
                      label="Cucina"
                      select
                      value={newRestaurant.cuisine}
                      onChange={(e) =>
                        setNewRestaurant({
                          ...newRestaurant,
                          cuisine: e.target.value as typeof newRestaurant.cuisine,
                        })
                      }
                      sx={{ flex: 1 }}
                    >
                      {CUISINE_OPTIONS.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Field>
                    <Field
                      id="new-rest-price"
                      label="Prezzo"
                      select
                      value={newRestaurant.priceRange}
                      onChange={(e) =>
                        setNewRestaurant({
                          ...newRestaurant,
                          priceRange: e.target.value as typeof newRestaurant.priceRange,
                        })
                      }
                      sx={{ width: 120 }}
                    >
                      {PRICE_OPTIONS.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </Field>
                  </Stack>
                  <Field
                    id="new-rest-desc"
                    label="Descrizione"
                    value={newRestaurant.description}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, description: e.target.value })
                    }
                    optional
                    multiline
                    minRows={2}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={pending}
                    onClick={handleAddRestaurant}
                    sx={{ alignSelf: 'flex-start' }}
                    startIcon={
                      pending ? <CircularProgress size={14} color="inherit" /> : null
                    }
                  >
                    Salva ristorante
                  </Button>
                </Stack>
              )}

              {/* Data + ora */}
              <Stack direction="row" spacing={1.5}>
                <Field
                  id="proposal-date"
                  label="Data"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  inputProps={{ min: isoToday() }}
                  sx={{ flex: 1 }}
                />
                <Field
                  id="proposal-time"
                  label="Orario"
                  type="time"
                  required
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  inputProps={{ step: 300 }}
                  sx={{ width: 140 }}
                />
              </Stack>

              {/* Visibilità */}
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                  Visibilità
                </Typography>
                <ToggleButtonGroup
                  value={visibility}
                  exclusive
                  onChange={(_, v) => v && setVisibility(v)}
                  size="medium"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  <ToggleButton value="public" sx={{ px: 2, gap: 1 }}>
                    <PublicOutlinedIcon sx={{ fontSize: 16 }} />
                    Pubblica
                  </ToggleButton>
                  <ToggleButton value="private" sx={{ px: 2, gap: 1 }}>
                    <LockOutlinedIcon sx={{ fontSize: 16 }} />
                    Privata
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {visibility === 'public'
                    ? 'Tutti i colleghi attivi vedono la proposta e possono unirsi.'
                    : 'Solo gli invitati vedono la proposta e possono unirsi.'}
                </Typography>
              </Stack>

              {/* Inviti — solo per private */}
              {visibility === 'private' ? (
                <Stack spacing={1}>
                  <Typography
                    component="label"
                    htmlFor="proposal-invitees"
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'text.primary',
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 1,
                    }}
                  >
                    Invitati
                    <Typography component="span" sx={{ color: 'error.main', fontSize: 14 }}>
                      *
                    </Typography>
                  </Typography>
                  <Autocomplete
                    id="proposal-invitees"
                    multiple
                    options={invitableUsers}
                    value={invitees}
                    onChange={(_, v) => setInvitees(v)}
                    getOptionLabel={(opt) => opt.displayName}
                    isOptionEqualToValue={(a, b) => a.userId === b.userId}
                  renderTags={(value, getTagProps) =>
                    value.map((u, idx) => {
                      const { key, ...chipProps } = getTagProps({ index: idx });
                      return (
                        <Chip
                          {...chipProps}
                          key={key}
                          avatar={<Avatar>{u.initials}</Avatar>}
                          label={u.displayName}
                          size="small"
                          variant="outlined"
                        />
                      );
                    })
                  }
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.userId}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: 11,
                            border: '2px solid',
                            borderColor: 'primary.main',
                            bgcolor: 'background.default',
                            color: 'text.primary',
                          }}
                        >
                          {opt.initials}
                        </Avatar>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {opt.displayName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                          >
                            {opt.team ?? opt.email}
                          </Typography>
                        </Stack>
                      </Stack>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Aggiungi colleghi…"
                      required
                    />
                  )}
                />
                </Stack>
              ) : null}

              {/* Nota */}
              <Field
                id="proposal-note"
                label="Nota (facoltativa)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Es. ci troviamo davanti al portone"
                multiline
                minRows={2}
                optional
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} variant="text" disabled={pending}>
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={pending || addingRestaurant}
              startIcon={
                pending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />
              }
            >
              Crea proposta
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
