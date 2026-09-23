import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LogInIcon,
  MenuIcon,
} from 'lucide-react';

import { Button, Dialog } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { BroadcastControls } from './app-top-nav/BroadcastControls';
import { MessagesPopover } from './app-top-nav/MessagesPopover';
import { NotificationsPopover } from './app-top-nav/NotificationsPopover';
import { ProcessingIndicator } from './app-top-nav/ProcessingIndicator';
import { iconBtnClass } from './app-top-nav/shared';
import { UserMenu } from './app-top-nav/UserMenu';
import { useTopNavState } from './app-top-nav/useTopNavState';
import { GlobalSearch } from './GlobalSearch';
import { RadioBookingCalendar } from './RadioBookingCalendar';
import { StreamManagerPanel } from './StreamManagerPanel';
import { TahtiLogoLink } from './TahtiLogo';
import { UploadTrackDialog } from './UploadTrackDialog';

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
    uploadOpen,
    setUploadOpen,
    streamManagerOpen,
    setStreamManagerOpen,
    bookingCalendarOpen,
    setBookingCalendarOpen,
    popupRef,
    hasChannel,
    processingItems,
  } = nav;

  return (
    <header className="border-border bg-background-secondary sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-2 sm:px-3 md:px-6">
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
        <div className="hidden items-center gap-0.5 sm:flex">
          <Button
            variant="text"
            size="icon-sm"
            className={cn(
              iconBtnClass,
              'disabled:pointer-events-none disabled:opacity-30',
            )}
            disabled={!canGoBack}
            aria-label="Go back"
            title="Go back"
            onClick={() => router.history.back()}
          >
            <ChevronLeftIcon size={16} />
          </Button>
          <Button
            variant="text"
            size="icon-sm"
            className={cn(
              iconBtnClass,
              'disabled:pointer-events-none disabled:opacity-30',
            )}
            disabled={!canGoForward}
            aria-label="Go forward"
            title="Go forward"
            onClick={() => router.history.forward()}
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center px-4 sm:flex">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1" ref={popupRef}>
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
      <UploadTrackDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <RadioBookingCalendar
        isOpen={bookingCalendarOpen}
        onClose={() => setBookingCalendarOpen(false)}
      />
      {user && hasChannel && user.channel ? (
        <Dialog.Root
          isOpen={streamManagerOpen}
          onClose={() => setStreamManagerOpen(false)}
          className="max-w-xl"
        >
          <Dialog.Title>Stream Manager</Dialog.Title>
          <div className="mt-4">
            <StreamManagerPanel
              slug={user.channel.slug}
              channelState={user.channel.state}
              defaultExpanded
            />
          </div>
        </Dialog.Root>
      ) : null}
    </header>
  );
}
