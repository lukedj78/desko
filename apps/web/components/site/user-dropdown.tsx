'use client';

import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { signOut } from '@/lib/auth-client';

type UserDropdownProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
  variant?: 'compact' | 'full'; // compact = topbar, full = sidebar footer
};

const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

export function UserDropdown({ user, variant = 'compact' }: UserDropdownProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pending, startTransition] = useTransition();
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    startTransition(async () => {
      await signOut();
      router.push('/login');
      router.refresh();
    });
  };

  const isAdmin = user.role === 'admin';
  const isHrAnalytics = user.role === 'hr_analytics';
  // Sia admin sia hr_analytics possono leggere l'aggregato HR (US-6).
  const canSeeHrAnalytics = isAdmin || isHrAnalytics;
  const initials = initialsFromName(user.name);

  return (
    <>
      {/* Trigger */}
      {variant === 'compact' ? (
        <ButtonBase
          onClick={handleOpen}
          aria-label={`Menu utente di ${user.name}`}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? 'user-dropdown-menu' : undefined}
          sx={{
            borderRadius: '50%',
            transition: 'all 120ms ease',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          <Avatar
            src={user.image ?? undefined}
            sx={{
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 700,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              cursor: 'pointer',
            }}
          >
            {initials}
          </Avatar>
        </ButtonBase>
      ) : (
        <ButtonBase
          onClick={handleOpen}
          aria-label={`Menu utente di ${user.name}`}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? 'user-dropdown-menu' : undefined}
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            borderRadius: 1.5,
            p: 1,
            transition: 'all 120ms ease',
            '&:hover': { backgroundColor: 'action.hover' },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
            <Avatar
              src={user.image ?? undefined}
              sx={{
                width: 36,
                height: 36,
                fontSize: 13,
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>
            <Stack sx={{ minWidth: 0, alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {user.role === 'admin'
                  ? 'Admin'
                  : user.role === 'hr_analytics'
                  ? 'HR Analytics'
                  : user.email}
              </Typography>
            </Stack>
          </Stack>
        </ButtonBase>
      )}

      {/* Menu */}
      <Menu
        id="user-dropdown-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 240,
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 12px 32px rgba(14,15,12,0.16), 0 0 0 1px rgba(14,15,12,0.06)',
              overflow: 'visible',
            },
          },
        }}
      >
        {/* Header con nome + email */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={user.image ?? undefined}
              sx={{
                width: 40,
                height: 40,
                fontSize: 14,
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              {initials}
            </Avatar>
            <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {user.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontFamily: 'var(--font-jetbrains)' }}
                noWrap
              >
                {user.email}
              </Typography>
            </Stack>
          </Stack>
          {isAdmin || isHrAnalytics ? (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                mt: 1,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                backgroundColor: isAdmin ? 'primary.main' : 'info.main',
                color: isAdmin ? 'primary.contrastText' : 'info.contrastText',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {isAdmin ? 'Admin' : 'HR Analytics'}
            </Box>
          ) : null}
        </Box>

        <Divider />

        <MenuItem component={Link} href="/impostazioni" onClick={handleClose}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Profilo e preferenze</Typography>
        </MenuItem>

        <MenuItem component={Link} href="/impostazioni" onClick={handleClose}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Impostazioni</Typography>
        </MenuItem>

        {canSeeHrAnalytics ? <Divider /> : null}
        {canSeeHrAnalytics ? (
          <MenuItem component={Link} href="/admin/analytics" onClick={handleClose}>
            <ListItemIcon>
              <InsightsOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>
              HR Analytics
            </Typography>
          </MenuItem>
        ) : null}
        {isAdmin ? (
          <MenuItem component={Link} href="/admin/users" onClick={handleClose}>
            <ListItemIcon>
              <AdminPanelSettingsOutlinedIcon fontSize="small" sx={{ color: 'primary.dark' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 600 }}>
              Gestione utenti
            </Typography>
          </MenuItem>
        ) : null}

        <Divider />

        <MenuItem onClick={handleLogout} disabled={pending}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
            {pending ? 'Disconnessione…' : 'Esci'}
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
