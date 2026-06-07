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

import { DeskoBrand } from '@/components/shared/brand/desko-brand';
import { UserDropdown } from '@/components/shared/user/user-dropdown';

type SessionUser = {
  name: string;
  email: string;
  image?: string | null;
  role?: string;
};

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const BOTTOM_NAV_HEIGHT = 64;

/**
 * Cookie name per persistere lo stato collapsed.
 * Letto server-side dal layout per evitare FOUC + utilizzo di useEffect
 * (state-discipline rung 7). Scrittura client-side dopo toggle utente.
 */
export const SIDEBAR_COOKIE_NAME = 'desko:sidebar-collapsed';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 anno

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type TopbarAction = { label: string; icon: React.ComponentType<{ className?: string }> };

const TOPBAR_ACTIONS: TopbarAction[] = [
  { label: 'Aiuto', icon: HelpCircle },
  { label: 'Notifiche', icon: Bell },
];

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="size-5" /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarDays className="size-5" /> },
  { label: 'Piani', href: '/piani', icon: <Layers className="size-5" /> },
  { label: 'Pranzo', href: '/lunch', icon: <Utensils className="size-5" /> },
  { label: 'Profilo', href: '/impostazioni', icon: <UserIcon className="size-5" /> },
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
    // TooltipProvider è fornito da AppShell (root), evitato wrapping ridondante
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
            <DeskoBrand size="md" />
          </div>
        ) : (
          // Expanded: logo + wordmark a sinistra, chevron comprimi a destra
          <div className="flex min-h-14 items-center justify-between gap-2 px-5 py-3">
            <Link href="/dashboard" className="no-underline">
              <DeskoBrand size="md" wordmark />
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
              <span>{item.label}</span>
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
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  user: SessionUser;
  initialCollapsed?: boolean;
}) {
  // Stato sincronizzato col cookie letto server-side dal layout — zero FOUC,
  // zero useEffect post-hydration (state-discipline rung 7 risolto upstream).
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      // Persistenza in cookie (path=/ per leggerlo da qualunque route)
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next ? '1' : '0'}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
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
            transition: 'width 200ms cubic-bezier(0.2, 0, 0, 1)',
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
              <Link href="/dashboard" className="no-underline md:hidden">
                <DeskoBrand size="md" wordmark />
              </Link>

              <div className="flex-1" />

              {TOPBAR_ACTIONS.map(({ label, icon: Icon }) => (
                <Tooltip key={label}>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label={label}
                        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Icon className="size-5" />
                      </button>
                    }
                  />
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
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
