import { Link, useRouterState } from '@tanstack/react-router';
import {
  CompassIcon,
  EllipsisIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  RadioIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { cn } from '../lib/cn';
import {
  activeMobileItem,
  isMobileMoreRoute,
  type MobileItemId,
} from '../lib/navigationActive';
import { useAuthStore } from '../stores/authStore';

const PRIMARY = [
  {
    to: '/',
    id: 'listen' as const satisfies MobileItemId,
    label: 'Listen',
    icon: GaugeIcon,
  },
  {
    to: '/discover',
    id: 'discover' as const satisfies MobileItemId,
    label: 'Discover',
    icon: CompassIcon,
  },
  {
    to: '/radio',
    id: 'radio' as const satisfies MobileItemId,
    label: 'Radio',
    icon: RadioIcon,
  },
] as const;

const STUDIO_TAB = {
  to: '/studio',
  id: 'studio' as const satisfies MobileItemId,
  label: 'Studio',
  icon: LayoutDashboardIcon,
};

type MobileBottomNavProps = {
  onOpenMore?: () => void;
  moreOpen?: boolean;
};

export function MobileBottomNav({
  onOpenMore,
  moreOpen = false,
}: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuthStore((state) => state.user);
  const showStudio =
    hasAccountRole(user, 'ARTIST') || hasAccountRole(user, 'BOARD');
  const items = showStudio ? [...PRIMARY, STUDIO_TAB] : [...PRIMARY];
  const mobileActive = activeMobileItem(pathname);
  const moreActive = isMobileMoreRoute(pathname, {
    studioIsPrimary: showStudio,
  });

  return (
    <nav
      className="border-border bg-background z-40 flex h-16 shrink-0 items-stretch justify-around border-t px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary"
      style={{ minHeight: 'var(--mobile-nav-h, 64px)' }}
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
                ? 'text-primary'
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
        onClick={onOpenMore}
        aria-label="More"
        aria-expanded={moreOpen}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] tracking-wide',
          moreActive || moreOpen
            ? 'text-primary'
            : 'text-foreground-secondary hover:text-foreground',
        )}
      >
        <EllipsisIcon
          size={18}
          strokeWidth={moreActive || moreOpen ? 2.5 : 2}
        />
        <span className="truncate">More</span>
      </button>
    </nav>
  );
}

type MobileDrawerProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
  /** Full-viewport sheet instead of a `min(100%,20rem)` side panel --
   * for content that wants the whole screen (e.g. a queue tracklist). */
  fullScreen?: boolean;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileDrawer({
  open,
  title,
  onClose,
  children,
  side = 'right',
  fullScreen = false,
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
          'border-border bg-background absolute inset-y-0 flex flex-col border shadow-lg',
          fullScreen
            ? 'inset-x-0 w-full'
            : cn('w-[min(100%,20rem)]', side === 'left' ? 'left-0' : 'right-0'),
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
          <Tooltip content="Close" side="top">
            <Button
              size="icon-sm"
              variant="text"
              onClick={onClose}
              aria-label="Close"
            >
              <XIcon size={16} />
            </Button>
          </Tooltip>
        </div>
        <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-auto p-3">
          {children}
        </div>
      </div>
    </div>
  );
}
