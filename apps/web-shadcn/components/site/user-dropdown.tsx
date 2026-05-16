'use client';

import {
  BarChart3,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@desko/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@desko/ui/components/dropdown-menu';
import { signOut } from '@/lib/auth-client';
import { cn } from '@desko/ui/lib/utils';

type UserDropdownProps = {
  user: { name: string; email: string; image?: string | null; role?: string };
  variant?: 'compact' | 'full';
};

const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

export function UserDropdown({ user, variant = 'compact' }: UserDropdownProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const isAdmin = user.role === 'admin';
  const isHrAnalytics = user.role === 'hr_analytics';
  const canSeeHrAnalytics = isAdmin || isHrAnalytics;
  const initials = initialsFromName(user.name);

  const handleLogout = () => {
    setPending(true);
    startTransition(async () => {
      await signOut();
      router.push('/login');
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'compact' ? (
          <button
            aria-label={`Menu utente di ${user.name}`}
            className="rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar className="size-9 ring-2 ring-primary">
              {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <button
            aria-label={`Menu utente di ${user.name}`}
            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar className="size-9 shrink-0 ring-2 ring-primary">
              {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-col items-start">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {isAdmin ? 'Admin' : isHrAnalytics ? 'HR Analytics' : user.email}
              </span>
            </div>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[240px]">
        {/* Header */}
        <div className="px-2 py-2 flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-primary">
            {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground font-mono">{user.email}</p>
          </div>
        </div>
        {isAdmin || isHrAnalytics ? (
          <div className="px-2 pb-2">
            <span
              className={cn(
                'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]',
                isAdmin ? 'bg-primary text-primary-foreground' : 'bg-info text-info-foreground',
              )}
            >
              {isAdmin ? 'Admin' : 'HR Analytics'}
            </span>
          </div>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/impostazioni" className="no-underline w-full">
            <UserIcon className="size-4" />
            <span>Profilo e preferenze</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/impostazioni" className="no-underline w-full">
            <Settings className="size-4" />
            <span>Impostazioni</span>
          </Link>
        </DropdownMenuItem>

        {canSeeHrAnalytics || isAdmin ? <DropdownMenuSeparator /> : null}

        {canSeeHrAnalytics ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/analytics" className="no-underline w-full text-info">
              <BarChart3 className="size-4" />
              <span className="font-semibold">HR Analytics</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/users" className="no-underline w-full">
              <ShieldCheck className="size-4 text-primary-foreground" />
              <span className="font-semibold text-primary-foreground">Gestione utenti</span>
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} disabled={pending} className="text-destructive">
          <LogOut className="size-4" />
          <span className="font-semibold">{pending ? 'Disconnessione…' : 'Esci'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
