import { Link, useRouterState } from '@tanstack/react-router';
import {
  CompassIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListMusicIcon,
  RadioIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from '@tahti-player/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { cn } from '../lib/cn';
import { activeMobileItem, type MobileItemId } from '../lib/navigationActive';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';

const NAV = [
  {
    to: '/',
    id: 'listen' as const satisfies MobileItemId,
    label: 'Listen',
    icon: GaugeIcon,
    boardOnly: false,
  },
  {
    to: '/radio',
    id: 'radio' as const satisfies MobileItemId,
    label: 'Radio',
    icon: RadioIcon,
    boardOnly: false,
  },
  {
    to: '/discover',
    id: 'discover' as const satisfies MobileItemId,
    label: 'Discover',
    icon: CompassIcon,
    boardOnly: false,
  },
  {
    to: '/library',
    id: 'library' as const satisfies MobileItemId,
    label: 'Library',
    icon: LibraryIcon,
    boardOnly: false,
  },
  {
    to: '/studio',
    id: 'studio' as const satisfies MobileItemId,
    label: 'Studio',
    icon: LayoutDashboardIcon,
    boardOnly: false,
  },
] as const;

type MobileBottomNavProps = {
  onOpenQueue?: () => void;
};

/** Fixed bottom tab bar for phone layouts. */
export function MobileBottomNav({ onOpenQueue }: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBoard = useAuthStore((state) => hasAccountRole(state.user, 'BOARD'));
  const toggleBottomQueue = useLayoutStore((s) => s.toggleBottomQueue);
  const openQueue = onOpenQueue ?? toggleBottomQueue;
  const items = NAV.filter((item) => !item.boardOnly || isBoard);
  const mobileActive = activeMobileItem(pathname);

  return (
    <nav
      className="border-border bg-background z-40 flex shrink-0 items-stretch justify-around border-t px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = mobileActive === item.id;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
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
        onClick={openQueue}
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
  /** Omit when the drawer's own content already renders a header
   * (e.g. RightRailPanel's icon + "Chat" label) -- avoids a duplicate,
   * icon-less title stacked above it. */
  title?: string;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Full-height slide-over used for nav / panels on mobile. Hand-rolled
 * rather than the shared headlessui-backed `Dialog` (different slide-over
 * shape, and `@headlessui/react` isn't a direct dependency of this
 * package) — so it needs its own focus trap and Escape handling instead
 * of getting them for free. */
export function MobileDrawer({
  open,
  title,
  onClose,
  children,
  side = 'right',
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

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
        ref={panelRef}
        className={cn(
          'border-border bg-background absolute inset-y-0 flex w-[min(100%,20rem)] flex-col border shadow-lg',
          side === 'left' ? 'left-0' : 'right-0',
        )}
      >
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          {title ? (
            <h2 className="font-display text-sm font-bold tracking-tight">
              {title}
            </h2>
          ) : (
            <span />
          )}
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
