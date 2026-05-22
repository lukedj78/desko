'use client';

import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Utensils,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@desko/ui/components/tooltip';
import { cn } from '@desko/ui/lib/utils';

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
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', shortLabel: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="size-5" /> },
  { label: 'Calendar', shortLabel: 'Calendar', href: '/calendar', icon: <CalendarDays className="size-5" /> },
  { label: 'Piani', shortLabel: 'Piani', href: '/piani', icon: <Layers className="size-5" /> },
  { label: 'Pranzo', shortLabel: 'Pranzo', href: '/lunch', icon: <Utensils className="size-5" /> },
  { label: 'Profilo', shortLabel: 'Profilo', href: '/impostazioni', icon: <UserIcon className="size-5" /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// SidebarContent — desktop sidebar contents (collapsed o expanded)
// ─────────────────────────────────────────────────────────────────────────────
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
    <TooltipProvider delay={300}>
      <div className="flex h-full flex-col">
        {collapsed ? (
          // Collapsed: prima il chevron espandi, poi il logo D
          <div className="flex flex-col items-center gap-2 py-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onToggleCollapsed}
                    aria-label="Espandi sidebar"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                }
              />
              <TooltipContent side="right" sideOffset={8}>
                Espandi sidebar
              </TooltipContent>
            </Tooltip>
            <span
              aria-hidden
              className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold text-sm"
            >
              D
            </span>
          </div>
        ) : (
          // Expanded: logo + wordmark a sinistra, chevron comprimi a destra
          <div className="flex min-h-14 items-center justify-between gap-2 px-5 py-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3 no-underline">
              <span
                aria-hidden
                className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold text-sm shrink-0"
              >
                D
              </span>
              <span className="text-base font-extrabold tracking-tight truncate">
                Desko
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onToggleCollapsed}
                    aria-label="Comprimi sidebar"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                }
              />
              <TooltipContent side="right" sideOffset={8}>
                Comprimi sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <nav
          className={cn(
            'flex flex-1 flex-col gap-1',
            collapsed ? 'px-2' : 'px-3',
          )}
        >
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === '/dashboard' && pathname === '/');
            const link = (
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg text-sm transition-colors no-underline',
                  collapsed ? 'justify-center px-0' : 'justify-start px-3',
                  active
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                style={
                  active
                    ? { backgroundColor: 'rgba(232, 185, 49, 0.18)' }
                    : undefined
                }
              >
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center justify-center',
                    active ? 'text-primary' : 'text-current',
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <React.Fragment key={item.href}>{link}</React.Fragment>
            );
          })}
        </nav>

        {/* Footer: UserDropdown — compact su sidebar collapsed, full su expanded */}
        <div
          className={cn(
            'border-t border-border',
            collapsed ? 'p-2 flex justify-center' : 'p-3',
          )}
        >
          <UserDropdown
            user={user}
            variant={collapsed ? 'compact' : 'full'}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileBottomNav — bottom navigation per mobile (port da MUI BottomNavigation)
// ─────────────────────────────────────────────────────────────────────────────
function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = NAV_ITEMS.findIndex(
    (item) =>
      pathname === item.href ||
      (item.href === '/dashboard' && pathname === '/'),
  );
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card"
      style={{
        height: BOTTOM_NAV_HEIGHT,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="grid h-full grid-cols-5">
        {NAV_ITEMS.map((item, i) => {
          const active = i === safeIndex;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1 text-[11px] transition-colors',
                active
                  ? 'font-semibold text-primary'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="inline-flex">{item.icon}</span>
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppShell — root layout (sidebar + topbar + main + mobile bottom nav)
// ─────────────────────────────────────────────────────────────────────────────
export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Lettura preferenza al mount (evita FOUC: applichiamo dopo l'hydration)
  React.useEffect(() => {
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

  const sidebarWidth = collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;

  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-dvh bg-background">
        {/* Permanent sidebar — desktop only */}
        <aside
          className="hidden md:block shrink-0 border-r border-border bg-card"
          style={{
            width: sidebarWidth,
            transition: hydrated ? 'width 200ms cubic-bezier(0.2, 0, 0, 1)' : 'none',
          }}
        >
          <div className="sticky top-0 h-dvh">
            <SidebarContent
              collapsed={collapsed}
              onToggleCollapsed={toggleCollapsed}
              user={user}
            />
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-border bg-card">
            <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6 md:min-h-16 md:px-8">
              {/* Mobile logo (sidebar è hidden su mobile) */}
              <Link
                href="/dashboard"
                className="flex items-center gap-3 no-underline md:hidden"
              >
                <span
                  aria-hidden
                  className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold text-sm"
                >
                  D
                </span>
                <span className="text-base font-extrabold tracking-tight">
                  Desko
                </span>
              </Link>

              <div className="flex-1" />

              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Aiuto"
                      className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <HelpCircle className="size-5" />
                    </button>
                  }
                />
                <TooltipContent>Aiuto</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Notifiche"
                      className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Bell className="size-5" />
                    </button>
                  }
                />
                <TooltipContent>Notifiche</TooltipContent>
              </Tooltip>
              <div className="ml-0.5">
                <UserDropdown user={user} variant="compact" />
              </div>
            </div>
          </header>

          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            {/* pb-20 = 80px ≈ BOTTOM_NAV_HEIGHT 64 + 16 buffer per mobile */}
            {children}
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </TooltipProvider>
  );
}
