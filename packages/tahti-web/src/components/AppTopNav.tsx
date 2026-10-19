import { LogInIcon, MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { BackButton, Button, CenteredLoader, Dialog } from '@tahti-player/ui';

import { useOpenedOnce } from '../hooks/useOpenedOnce';
import { cn } from '../lib/cn';
import { BroadcastControls } from './app-top-nav/BroadcastControls';
import { MessagesPopover } from './app-top-nav/MessagesPopover';
import { NotificationsPopover } from './app-top-nav/NotificationsPopover';
import { ProcessingIndicator } from './app-top-nav/ProcessingIndicator';
import { iconBtnClass } from './app-top-nav/shared';
import { UserMenu } from './app-top-nav/UserMenu';
import { useTopNavState } from './app-top-nav/useTopNavState';
import { GlobalSearch } from './GlobalSearch';
import { TahtiLogoLink } from './TahtiLogo';

const RadioBookingCalendar = lazy(() =>
  import('./RadioBookingCalendar').then((m) => ({
    default: m.RadioBookingCalendar,
  })),
);
const StreamManagerPanel = lazy(() =>
  import('./StreamManagerPanel').then((m) => ({
    default: m.StreamManagerPanel,
  })),
);

type AppTopNavProps = {
  /** Show hamburger for mobile left drawer. */
  showMenuButton?: boolean;
  onOpenMenu?: () => void;
};

/**
 * Production-parity top bar (StudioTopNav / ChannelHeader chrome):
 * logo left, icon actions right, labels only inside the user dropdown.
 */
export function AppTopNav({ showMenuButton, onOpenMenu }: AppTopNavProps) {
  const nav = useTopNavState();
  const {
    router,
    canGoBack,
    canGoForward,
    user,
    openAuth,
    streamManagerOpen,
    setStreamManagerOpen,
    bookingCalendarOpen,
    setBookingCalendarOpen,
    popupRef,
    hasChannel,
    processingItems,
  } = nav;
  const [phoneSearchOpen, setPhoneSearchOpen] = useState(false);
  const bookingCalendarOpened = useOpenedOnce(bookingCalendarOpen);
  const streamManagerOpened = useOpenedOnce(streamManagerOpen);

  return (
    <header className="tahti-theme-chrome border-border bg-background-secondary sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-2 sm:px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {showMenuButton ? (
          <Button
            variant="text"
            size="icon-sm"
            className={iconBtnClass}
            aria-label="Open menu"
            onClick={onOpenMenu}
          >
            <MenuIcon size={18} />
          </Button>
        ) : null}
        <TahtiLogoLink markOnly />
        {user && processingItems.length > 0 ? (
          <ProcessingIndicator nav={nav} />
        ) : null}
        <div className="hidden items-center gap-1 sm:flex">
          <BackButton
            disabled={!canGoBack}
            title="Go back"
            onClick={() => router.history.back()}
          />
          <BackButton
            direction="forward"
            disabled={!canGoForward}
            title="Go forward"
            onClick={() => router.history.forward()}
          />
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center px-4 sm:flex">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1" ref={popupRef}>
        <Button
          variant="text"
          size="icon-sm"
          className={cn(iconBtnClass, 'sm:hidden')}
          aria-label="Search"
          title="Search"
          data-testid="topbar-search"
          onClick={() => setPhoneSearchOpen(true)}
        >
          <SearchIcon size={16} />
        </Button>
        {user && hasChannel ? <BroadcastControls nav={nav} /> : null}

        {user ? <NotificationsPopover nav={nav} /> : null}

        {user ? <MessagesPopover nav={nav} /> : null}

        {user ? (
          <UserMenu nav={nav} />
        ) : (
          <Button
            variant="text"
            size="icon-sm"
            className={iconBtnClass}
            aria-label="Log in"
            title="Log in"
            data-tour-id="topbar-login"
            onClick={() => openAuth('login')}
          >
            <LogInIcon size={16} />
          </Button>
        )}
      </div>
      {phoneSearchOpen ? (
        <div
          className="bg-background-secondary absolute inset-0 z-10 flex items-center gap-1 px-2 sm:hidden"
          data-testid="phone-search"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setPhoneSearchOpen(false);
            }
          }}
        >
          <GlobalSearch
            autoFocus
            fullWidth
            onDone={() => setPhoneSearchOpen(false)}
          />
          <Button
            variant="text"
            size="icon-sm"
            className={iconBtnClass}
            aria-label="Close search"
            title="Close search"
            onClick={() => setPhoneSearchOpen(false)}
          >
            <XIcon size={16} />
          </Button>
        </div>
      ) : null}
      {bookingCalendarOpened ? (
        <Suspense fallback={null}>
          <RadioBookingCalendar
            isOpen={bookingCalendarOpen}
            onClose={() => setBookingCalendarOpen(false)}
          />
        </Suspense>
      ) : null}
      {streamManagerOpened && user && hasChannel && user.channel ? (
        <Dialog.Root
          isOpen={streamManagerOpen}
          onClose={() => setStreamManagerOpen(false)}
          className="max-w-xl"
        >
          <Dialog.Title>Stream Manager</Dialog.Title>
          <div className="mt-4">
            <Suspense fallback={<CenteredLoader />}>
              <StreamManagerPanel
                slug={user.channel.slug}
                channelState={user.channel.state}
                defaultExpanded
              />
            </Suspense>
          </div>
        </Dialog.Root>
      ) : null}
    </header>
  );
}
