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

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, ExternalLink } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { type TopNavState } from './useTopNavState';

const NOTIFICATIONS_DOT = 'bg-accent-red';
const MESSAGES_DOT = 'bg-accent-cyan';
const BOTH_DOT =
  'bg-[linear-gradient(135deg,var(--color-accent-red)_50%,var(--color-accent-cyan)_50%)]';

function UnreadDot({ className }: { className: string }) {
  return (
    <span
      className={cn('size-2 shrink-0 rounded-full', className)}
      aria-hidden
    />
  );
}

function unreadLabel(
  t: TFunction<'web'>,
  notifications: boolean,
  messages: boolean,
): string {
  if (notifications && messages) {
    return t('nav.unreadBoth');
  }
  if (notifications) {
    return t('nav.unreadNotifications');
  }
  return messages ? t('nav.unreadMessages') : '';
}

export function UserMenu({ nav }: { nav: TopNavState }) {
  const { t } = useTranslation('web');
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
    unreadNotificationCount,
    unreadMessagesCount,
  } = nav;

  if (!user) {
    return null;
  }

  const hasUnreadNotifications = unreadNotificationCount > 0;
  const hasUnreadMessages = unreadMessagesCount > 0;
  const itemClass =
    'hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs active:scale-100';

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
        aria-label={`${t('nav.signedInAs', { name: displayName })}${unreadLabel(
          t,
          hasUnreadNotifications,
          hasUnreadMessages,
        )}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setNotificationsOpen(false);
          setMessagesOpen(false);
          setOpen((v) => !v);
        }}
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
          className="bg-primary/20 text-primary-strong font-display relative flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          aria-hidden
        >
          {initial}
          {hasUnreadNotifications || hasUnreadMessages ? (
            <span
              data-testid="account-unread-pill"
              data-unread={[
                hasUnreadNotifications && 'notifications',
                hasUnreadMessages && 'messages',
              ]
                .filter(Boolean)
                .join(' ')}
              className={cn(
                'ring-background motion-safe:animate-in motion-safe:zoom-in-50 absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 motion-safe:duration-300',
                hasUnreadNotifications && hasUnreadMessages
                  ? BOTH_DOT
                  : hasUnreadNotifications
                    ? NOTIFICATIONS_DOT
                    : MESSAGES_DOT,
              )}
            />
          ) : null}
        </span>
        <span className="text-foreground-secondary text-[10px]" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </Button>

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
            <Link
              to="/notifications"
              className={itemClass}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setMessagesOpen(false);
                setNotificationsOpen(false);
              }}
            >
              <BellIcon size={14} />
              {t('nav.notifications')}
              {hasUnreadNotifications ? (
                <UnreadDot className={cn('ml-auto', NOTIFICATIONS_DOT)} />
              ) : null}
            </Link>
          ) : (
            <Button
              variant="text"
              size="flexible"
              className={itemClass}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setMessagesOpen(false);
                setNotificationsOpen(true);
              }}
            >
              <BellIcon size={14} />
              {t('nav.notifications')}
              {hasUnreadNotifications ? (
                <UnreadDot className={cn('ml-auto', NOTIFICATIONS_DOT)} />
              ) : null}
            </Button>
          )}
          <Button
            variant="text"
            size="flexible"
            className={itemClass}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setNotificationsOpen(false);
              setMessagesOpen(true);
            }}
          >
            <MessageSquareIcon size={14} />
            {t('nav.messages')}
            {hasUnreadMessages ? (
              <UnreadDot className={cn('ml-auto', MESSAGES_DOT)} />
            ) : null}
          </Button>
          <div className="bg-border mx-1 my-0.5 h-px" role="separator" />

          {hasChannel ? (
            <>
              <Link
                to="/studio"
                className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-2 text-xs"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboardIcon size={14} />
                {t('nav.studio')}
              </Link>
              <Link
                to="/u/$username"
                params={{ username: user.username }}
                className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-2 text-xs"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <UserIcon size={14} />
                {t('nav.myArtistProfile')}
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
            {t('nav.settings')}
          </Button>
          <ExternalLink
            href="https://tahti.live"
            className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-2 text-xs no-underline"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <ExternalLinkIcon size={14} />
            tahti.live
          </ExternalLink>

          <div className="bg-border mx-1 my-0.5 h-px" role="separator" />
          <Button
            variant="text"
            size="flexible"
            className="text-accent-red-strong hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs active:scale-100"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <LogOutIcon size={14} />
            {t('nav.logOut')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
