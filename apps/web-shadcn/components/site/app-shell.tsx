'use client';

import {
  Bell,
  CalendarDays,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Menu as MenuIcon,
  Utensils,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { UserDropdown } from './user-dropdown';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="size-5" /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarDays className="size-5" /> },
  { label: 'Piani', href: '/piani', icon: <Layers className="size-5" /> },
  { label: 'Pranzo', href: '/lunch', icon: <Utensils className="size-5" /> },
  { label: 'Profilo', href: '/impostazioni', icon: <UserIcon className="size-5" /> },
];

type SessionUser = { name: string; email: string; image?: string | null; role?: string };

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <TooltipProvider delayDuration={300}>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === '/dashboard' && pathname === '/');
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors no-underline',
                    'lg:justify-start',
                    active
                      ? 'bg-primary/15 text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className={cn('shrink-0', active ? 'text-primary' : 'text-current')}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export function AppShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  const pathname = usePathname();
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  // Chiudi sheet quando si naviga
  React.useEffect(() => {
    setMobileSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-muted">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold text-base">
            D
          </span>
          <span className="text-lg font-extrabold tracking-tight">Desko</span>
        </div>
        <SidebarNav pathname={pathname} />
        <div className="mt-auto border-t border-border p-3">
          <UserDropdown user={user} variant="full" />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar mobile + helpers */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-card px-4 lg:px-6">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
                aria-label="Apri menu"
              >
                <MenuIcon className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-extrabold text-base">
                  D
                </span>
                <span className="text-lg font-extrabold tracking-tight">Desko</span>
              </div>
              <SidebarNav pathname={pathname} />
              <div className="mt-auto border-t border-border p-3">
                <UserDropdown user={user} variant="full" />
              </div>
            </SheetContent>
          </Sheet>

          {/* Brand mobile (hidden desktop) */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="inline-flex size-7 items-center justify-center rounded bg-primary text-primary-foreground font-extrabold text-sm">
              D
            </span>
            <span className="text-base font-extrabold tracking-tight">Desko</span>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">
            <button
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Aiuto"
            >
              <HelpCircle className="size-5" />
            </button>
            <button
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifiche"
            >
              <Bell className="size-5" />
            </button>
            <UserDropdown user={user} variant="compact" />
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
