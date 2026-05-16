'use client';

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { UserDropdown } from './user-dropdown';

type SessionUser = {
  name: string;
  email: string;
  image?: string | null;
  role?: string;
};

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const BOTTOM_NAV_HEIGHT = 64;
const STORAGE_KEY = 'desko:sidebar-collapsed';

type NavItem = {
  label: string;
  shortLabel: string;
  href: string;
  icon: ReactElement;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', shortLabel: 'Dashboard', href: '/dashboard', icon: <TodayOutlinedIcon /> },
  { label: 'Calendar', shortLabel: 'Calendar', href: '/calendar', icon: <CalendarMonthOutlinedIcon /> },
  { label: 'Piani', shortLabel: 'Piani', href: '/piani', icon: <LayersOutlinedIcon /> },
  { label: 'Pranzo', shortLabel: 'Pranzo', href: '/lunch', icon: <RestaurantOutlinedIcon /> },
  { label: 'Profilo', shortLabel: 'Profilo', href: '/impostazioni', icon: <PersonOutlineIcon /> },
];

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  user,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  user: SessionUser;
}) {
  const pathname = usePathname();

  return (
    <Stack sx={{ height: '100%' }}>
      {collapsed ? (
        // Collapsed: prima il chevron espandi, poi il logo D
        <Stack alignItems="center" spacing={1} sx={{ py: 1.5 }}>
          <Tooltip title="Espandi sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapsed}
              aria-label="Espandi sidebar"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box
            component="span"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
            }}
            aria-hidden
          >
            D
          </Box>
        </Stack>
      ) : (
        // Expanded: logo + wordmark a sinistra, chevron comprimi a destra
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2, minHeight: 56 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              component="span"
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                flexShrink: 0,
              }}
              aria-hidden
            >
              D
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}
              noWrap
            >
              Desko
            </Typography>
          </Stack>
          <Tooltip title="Comprimi sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapsed}
              aria-label="Comprimi sidebar"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      <List sx={{ px: collapsed ? 1 : 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          const button = (
            <ListItemButton
              component={Link}
              href={item.href}
              selected={active}
              sx={{
                borderRadius: 1.5,
                px: collapsed ? 0 : 1.5,
                py: 1,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(232, 185, 49, 0.18)',
                  color: 'text.primary',
                  '& .MuiListItemIcon-root': { color: 'primary.dark' },
                  '&:hover': { backgroundColor: 'rgba(232, 185, 49, 0.24)' },
                },
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  color: 'text.secondary',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed ? (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
                />
              ) : null}
            </ListItemButton>
          );
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Footer: UserDropdown — compact su sidebar collapsed, full su expanded */}
      <Box sx={{ p: collapsed ? 1.5 : 1, borderTop: '1px solid', borderColor: 'divider' }}>
        {collapsed ? (
          <Stack alignItems="center">
            <UserDropdown user={user} variant="compact" />
          </Stack>
        ) : (
          <UserDropdown user={user} variant="full" />
        )}
      </Box>
    </Stack>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    pathname === item.href || (item.href === '/dashboard' && pathname === '/'),
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'appBar',
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={activeIndex >= 0 ? activeIndex : 0}
        onChange={(_, newIndex: number) => {
          const target = NAV_ITEMS[newIndex];
          if (target) router.push(target.href);
        }}
        showLabels
        sx={{
          height: BOTTOM_NAV_HEIGHT,
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            minWidth: 'auto',
            py: 1,
            '&.Mui-selected': {
              color: 'primary.dark',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: 11,
            fontWeight: 500,
            '&.Mui-selected': { fontSize: 11, fontWeight: 600 },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.shortLabel}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Box>
  );
}

export function AppShell({ children, user }: { children: ReactNode; user: SessionUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Lettura preferenza al mount (evita FOUC: applichiamo dopo l'hydration)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {
      // ignore — localStorage non sempre disponibile (SSR / private mode)
    }
    setHydrated(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/* Permanent sidebar — desktop only */}
      <Box
        component="aside"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: { xs: 'none', md: 'block' },
          transition: hydrated ? 'width 200ms cubic-bezier(0.2, 0, 0, 1)' : 'none',
        }}
      >
        <Box sx={{ position: 'sticky', top: 0, height: '100dvh' }}>
          <SidebarContent collapsed={collapsed} onToggleCollapsed={toggleCollapsed} user={user} />
        </Box>
      </Box>

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar position="sticky" sx={{ backgroundColor: 'background.paper' }}>
          <Toolbar
            sx={{
              minHeight: { xs: 56, md: 64 },
              px: { xs: 2, sm: 3, md: 4 },
              gap: 2,
            }}
          >
            {/* Mobile logo (sidebar è hidden) */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <Box
                component="span"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
                aria-hidden
              >
                D
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                Desko
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Aiuto">
              <IconButton aria-label="Aiuto" size="small">
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifiche">
              <IconButton aria-label="Notifiche" size="small">
                <NotificationsOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ ml: 0.5 }}>
              <UserDropdown user={user} variant="compact" />
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            // padding-bottom su mobile per evitare che il bottom-nav copra il contenuto
            pb: { xs: `${BOTTOM_NAV_HEIGHT + 16}px`, md: 0 },
          }}
        >
          {children}
        </Box>
      </Stack>

      <MobileBottomNav />
    </Box>
  );
}
