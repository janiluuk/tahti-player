import { Link } from '@tanstack/react-router';
import {
  BellIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';

import { Badge, Button } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { type TopNavState } from './useTopNavState';

export function UserMenu({ nav }: { nav: TopNavState }) {
  const {
    isMobile,
    user,
    logout,
    openSettings,
    open,
    setOpen,
    setMessagesOpen,
    setNotificationsOpen,
    menuRef,
    hasChannel,
    isLive,
    displayName,
    initial,
    unreadNotifications,
    unreadMessagesCount,
  } = nav;

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="text"
        size="flexible"
        data-tour-id="topbar-account"
        className={cn(
          'hover:bg-background-secondary inline-flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition-colors active:scale-100',
          open ? 'border-border bg-background-secondary' : 'border-border/60',
        )}
        aria-label={`Signed in as ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {isLive ? (
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              isLive
                ? 'bg-accent-green motion-safe:animate-pulse'
                : 'bg-primary',
            )}
            aria-hidden
          />
        ) : null}
        <span
          className="bg-primary/20 text-primary font-display flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          aria-hidden
        >
          {initial}
        </span>
        <span className="text-foreground-secondary text-[10px]" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </Button>
      {isMobile &&
      (unreadNotifications.length > 0 || unreadMessagesCount > 0) ? (
        <Badge
          variant="pill"
          color="red"
          className="absolute -top-1 -right-1 min-w-4 px-1 text-center text-[9px] font-bold"
        >
          {Math.min(9, unreadNotifications.length + unreadMessagesCount)}
        </Badge>
      ) : null}

      {open ? (
        <div
          className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 flex min-w-[11.5rem] flex-col gap-0.5 rounded-lg border p-1.5 shadow-lg"
          role="menu"
        >
          <div className="text-foreground-secondary truncate px-2.5 py-1.5 text-[11px]">
            {displayName}
            {user.username ? (
              <span className="block truncate opacity-80">
                @{user.username}
              </span>
            ) : null}
          </div>
          <div className="bg-border mx-1 my-0.5 h-px" role="separator" />

          {isMobile ? (
            <>
              <Button
                variant="text"
                size="flexible"
                className="hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs active:scale-100"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setMessagesOpen(false);
                  setNotificationsOpen(true);
                }}
              >
                <BellIcon size={14} />
                Notifications
                {unreadNotifications.length > 0 ? (
                  <Badge
                    variant="pill"
                    color="red"
                    className="ml-auto min-w-4 px-1 text-center text-[9px] font-bold"
                  >
                    {Math.min(9, unreadNotifications.length)}
                  </Badge>
                ) : null}
              </Button>
              <Button
                variant="text"
                size="flexible"
                className="hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs active:scale-100"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setNotificationsOpen(false);
                  setMessagesOpen(true);
                }}
              >
                <MessageSquareIcon size={14} />
                Messages
                {unreadMessagesCount > 0 ? (
                  <Badge
                    variant="pill"
                    color="red"
                    className="ml-auto min-w-4 px-1 text-center text-[9px] font-bold"
                  >
                    {Math.min(9, unreadMessagesCount)}
                  </Badge>
                ) : null}
              </Button>
              <div className="bg-border mx-1 my-0.5 h-px" role="separator" />
            </>
          ) : null}

          {hasChannel ? (
            <>
              <Link
                to="/studio"
                className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-2 text-xs"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboardIcon size={14} />
                Artist panel
              </Link>
              <Link
                to="/u/$username"
                params={{ username: user.username }}
                className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-2 text-xs"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <UserIcon size={14} />
                My channel
              </Link>
            </>
          ) : null}

          <Button
            variant="text"
            size="flexible"
            className="hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs active:scale-100"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openSettings('account');
            }}
          >
            <SettingsIcon size={14} />
            Settings
          </Button>
          <a
            href="https://tahti.live"
            className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-2 text-xs"
            role="menuitem"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <ExternalLinkIcon size={14} />
            tahti.live
          </a>

          <div className="bg-border mx-1 my-0.5 h-px" role="separator" />
          <Button
            variant="text"
            size="flexible"
            className="text-accent-red hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs active:scale-100"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <LogOutIcon size={14} />
            Log out
          </Button>
        </div>
      ) : null}
    </div>
  );
}
