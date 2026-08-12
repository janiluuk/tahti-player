import { Link, useRouterState } from '@tanstack/react-router';
import {
  GaugeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListMusicIcon,
  MapIcon,
  RadioIcon,
  XIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@nuclearplayer/ui';

import { cn } from '../lib/cn';

const NAV = [
  {
    to: '/',
    label: 'Listen',
    icon: GaugeIcon,
    match: (p: string) => p === '/',
  },
  {
    to: '/radio',
    label: 'Radio',
    icon: RadioIcon,
    match: (p: string) => p.startsWith('/radio'),
  },
  {
    to: '/library',
    label: 'Library',
    icon: LibraryIcon,
    match: (p: string) =>
      p.startsWith('/library') || p.startsWith('/favorites'),
  },
  {
    to: '/studio',
    label: 'Studio',
    icon: LayoutDashboardIcon,
    match: (p: string) => p.startsWith('/studio'),
  },
  {
    to: '/more',
    label: 'More',
    icon: MapIcon,
    match: (p: string) =>
      p.startsWith('/more') ||
      p.startsWith('/settings') ||
      p.startsWith('/sources'),
  },
] as const;

type MobileBottomNavProps = {
  onOpenQueue: () => void;
};

/** Fixed bottom tab bar for phone layouts. */
export function MobileBottomNav({ onOpenQueue }: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="border-border bg-background z-40 flex shrink-0 items-stretch justify-around border-t px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary"
    >
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] tracking-wide',
              active
                ? 'text-foreground'
                : 'text-foreground-secondary hover:text-foreground',
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenQueue}
        className="text-foreground-secondary hover:text-foreground flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] tracking-wide"
      >
        <ListMusicIcon size={18} />
        <span className="truncate">Queue</span>
      </button>
    </nav>
  );
}

type MobileDrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
};

/** Full-height slide-over used for nav / queue on mobile. */
export function MobileDrawer({
  open,
  title,
  onClose,
  children,
  side = 'right',
}: MobileDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'border-border bg-background absolute inset-y-0 flex w-[min(100%,20rem)] flex-col border shadow-lg',
          side === 'left' ? 'left-0' : 'right-0',
        )}
      >
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          <h2 className="font-display text-sm font-bold tracking-tight">
            {title}
          </h2>
          <Button
            size="icon-sm"
            variant="text"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon size={16} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
      </div>
    </div>
  );
}
