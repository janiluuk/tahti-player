import { Link, useRouterState } from '@tanstack/react-router';
import {
  CompassIcon,
  EllipsisIcon,
  LayoutDashboardIcon,
  ListMusicIcon,
  RadioIcon,
  XIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip, useSkipEnterMotion } from '@tahti-player/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { cn } from '../lib/cn';
import {
  activeMobileItem,
  isMobileMoreRoute,
  type MobileItemId,
} from '../lib/navigationActive';
import { navigationPathname } from '../lib/navigationPathname';
import { useAuthStore } from '../stores/authStore';

const DRAWER_SPRING = { type: 'spring', stiffness: 420, damping: 40 } as const;

const PRIMARY = [
  {
    to: '/',
    id: 'listen' as const satisfies MobileItemId,
    labelKey: 'nav.listen',
    icon: ListMusicIcon,
  },
  {
    to: '/discover',
    id: 'discover' as const satisfies MobileItemId,
    labelKey: 'nav.discover',
    icon: CompassIcon,
  },
  {
    to: '/radio',
    id: 'radio' as const satisfies MobileItemId,
    labelKey: 'nav.radio',
    icon: RadioIcon,
  },
] as const;

const STUDIO_TAB = {
  to: '/studio',
  id: 'studio' as const satisfies MobileItemId,
  labelKey: 'nav.studio' as const,
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
  const { t } = useTranslation('web');
  const pathname = useRouterState({ select: navigationPathname });
  const user = useAuthStore((state) => state.user);
  const signedOut = !user;
  const showStudio =
    hasAccountRole(user, 'ARTIST') || hasAccountRole(user, 'BOARD');
  const items =
    showStudio || signedOut ? [...PRIMARY, STUDIO_TAB] : [...PRIMARY];
  const mobileActive = activeMobileItem(pathname);
  const moreActive = isMobileMoreRoute(pathname, {
    studioIsPrimary: showStudio,
  });

  return (
    <nav
      className="border-border bg-background z-40 flex h-16 shrink-0 items-stretch justify-around border-t px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label={t('nav.primary')}
      data-testid="mobile-bottom-nav"
      style={{ minHeight: 'var(--mobile-nav-h, 64px)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = mobileActive === item.id;
        if (item.id === 'studio' && signedOut) {
          return (
            <Button
              key={item.id}
              variant="plain"
              size="flexible"
              aria-disabled="true"
              aria-label={t('nav.studio')}
              onClick={(event) => {
                event.preventDefault();
              }}
              className="text-foreground-secondary min-w-0 flex-1 cursor-not-allowed flex-col justify-center gap-0.5 px-1 py-1.5 text-[10px] tracking-wide whitespace-normal active:scale-100"
            >
              <Icon size={18} strokeWidth={2} />
              <span className="truncate">{t(item.labelKey)}</span>
            </Button>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] tracking-wide',
              active
                ? 'text-primary-strong'
                : 'text-foreground-secondary hover:text-foreground',
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            <span className="truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
      <Button
        variant="text"
        size="flexible"
        type="button"
        onClick={onOpenMore}
        aria-label={t('nav.moreNavigation')}
        aria-expanded={moreOpen}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] tracking-wide hover:bg-transparent',
          moreActive || moreOpen
            ? 'text-primary-strong'
            : 'text-foreground-secondary hover:text-foreground',
        )}
      >
        <EllipsisIcon
          size={18}
          strokeWidth={moreActive || moreOpen ? 2.5 : 2}
        />
        <span className="truncate">{t('nav.more')}</span>
      </Button>
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

const CLOSE_TOOLTIP_ARM_MS = 400;

export function MobileDrawer({
  open,
  title,
  onClose,
  children,
  side = 'right',
  fullScreen = false,
}: MobileDrawerProps) {
  const { t } = useTranslation('web');
  const panelRef = useRef<HTMLDivElement>(null);
  const [closeTooltipArmed, setCloseTooltipArmed] = useState(false);
  const reducedMotion = useSkipEnterMotion();
  const offScreenX = side === 'left' ? '-100%' : '100%';

  useEffect(() => {
    if (!open) {
      setCloseTooltipArmed(false);
      return;
    }
    setCloseTooltipArmed(false);
    const arm = window.setTimeout(
      () => setCloseTooltipArmed(true),
      CLOSE_TOOLTIP_ARM_MS,
    );
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];
    panel?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(arm);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          key="mobile-drawer"
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal
          aria-label={title}
          data-testid="mobile-drawer"
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.18, ease: 'easeOut' }
            }
          >
            <Button
              variant="plain"
              size="flexible"
              tabIndex={-1}
              aria-hidden
              data-testid="mobile-drawer-scrim"
              className="absolute inset-0 rounded-none bg-black/50 active:scale-100"
              onClick={onClose}
            />
          </motion.div>
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              'border-border bg-background absolute inset-y-0 flex flex-col border pt-[env(safe-area-inset-top)] shadow-lg outline-none',
              fullScreen
                ? 'inset-x-0 w-full'
                : cn(
                    'w-[min(100%,20rem)]',
                    side === 'left' ? 'left-0' : 'right-0',
                  ),
            )}
            initial={reducedMotion ? false : { x: offScreenX, opacity: 0.98 }}
            animate={{ x: 0, opacity: 1 }}
            exit={
              reducedMotion ? { opacity: 0 } : { x: offScreenX, opacity: 0.98 }
            }
            transition={reducedMotion ? { duration: 0 } : DRAWER_SPRING}
          >
            <div className="border-border flex items-center justify-between border-b px-3 py-2">
              {title ? (
                <h2 className="font-display text-sm font-bold tracking-tight">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <Tooltip
                content={t('actions.close')}
                side="top"
                disabled={!closeTooltipArmed}
              >
                <Button
                  size="icon"
                  variant="text"
                  onClick={onClose}
                  aria-label={t('actions.close')}
                  className="size-11"
                >
                  <XIcon size={16} />
                </Button>
              </Tooltip>
            </div>
            <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
