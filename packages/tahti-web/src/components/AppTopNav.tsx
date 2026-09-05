import {
  Link,
  useCanGoBack,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  RadioIcon,
  SettingsIcon,
  UploadIcon,
  UserIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge, Button, EmptyState } from '@tahti-player/ui';

import { fetchConversations, type ConversationSummary } from '../api/messages';
import { fetchStudioSounds } from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { useCanGoForward } from '../hooks/useCanGoForward';
import { useOwnBroadcastPresence } from '../hooks/useOwnBroadcastPresence';
import { cn } from '../lib/cn';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { useProcessingJobsStore } from '../stores/processingJobsStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { GlobalSearch } from './GlobalSearch';
import { TahtiLogoLink } from './TahtiLogo';
import { UploadTrackDialog } from './UploadTrackDialog';

type AppTopNavProps = {
  /** Show hamburger for mobile left drawer. */
  showMenuButton?: boolean;
  onOpenMenu?: () => void;
};

const iconBtnClass =
  'text-foreground-secondary hover:text-foreground hover:bg-background-secondary inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-border';

/**
 * Production-parity top bar (StudioTopNav / ChannelHeader chrome):
 * logo left, icon actions right, labels only inside the user dropdown.
 */
export function AppTopNav({ showMenuButton, onOpenMenu }: AppTopNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const canGoForward = useCanGoForward();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openAuth = useAuthModalStore((s) => s.open);
  const openSettings = useSettingsModalStore((s) => s.open);
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const notifications = useNotificationInboxStore((s) => s.items);
  const acknowledgeNotification = useNotificationInboxStore(
    (s) => s.acknowledge,
  );
  const markNonStickyRead = useNotificationInboxStore(
    (s) => s.markNonStickyRead,
  );
  const [archiveItems, setArchiveItems] = useState<StudioSound[]>([]);
  const localProcessingJobs = useProcessingJobsStore((state) => state.jobs);
  const settleProcessingJobs = useProcessingJobsStore((state) => state.settle);
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const hasChannel = Boolean(user?.channel?.slug);
  const broadcast = useOwnBroadcastPresence({
    enabled: Boolean(user && hasChannel),
    channelState: user?.channel?.state,
    refreshWhen: broadcastOpen,
  });
  const isLive = broadcast.kind === 'live';
  const hasConnectionIssue =
    user?.channel?.state === 'LIVE' && !broadcast.signalConnected;
  const hasBroadcastWarning = broadcast.kind === 'preview';
  const broadcastTone = isLive
    ? 'healthy'
    : hasConnectionIssue
      ? 'error'
      : hasBroadcastWarning
        ? 'warning'
        : 'idle';
  const broadcastToneClass = {
    healthy:
      'border-accent-green/70 bg-accent-green/15 text-accent-green motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]',
    error:
      'border-accent-red/70 bg-accent-red/15 text-accent-red motion-safe:animate-[pulse_1.1s_ease-in-out_infinite]',
    warning:
      'border-accent-yellow/70 bg-accent-yellow/15 text-accent-yellow motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]',
    idle: '',
  }[broadcastTone];
  const displayName = user?.displayName?.trim() || user?.username || '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!broadcastOpen && !messagesOpen && !notificationsOpen) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setBroadcastOpen(false);
        setMessagesOpen(false);
        setNotificationsOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setBroadcastOpen(false);
        setMessagesOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [broadcastOpen, messagesOpen, notificationsOpen]);

  useEffect(() => {
    if (!messagesOpen) {
      return;
    }
    void fetchConversations().then((result) => setConversations(result.data));
  }, [messagesOpen]);

  useEffect(() => {
    if (!user || !notificationsOpen) {
      return;
    }
    void markNonStickyRead();
  }, [markNonStickyRead, notificationsOpen, user]);

  useEffect(() => {
    if (!user) {
      setArchiveItems([]);
      return;
    }
    let cancelled = false;
    const loadArchiveStatus = () => {
      void fetchStudioSounds().then((result) => {
        if (!cancelled) {
          setArchiveItems(result.data);
          settleProcessingJobs(
            result.data
              .filter(
                (item) => item.status === 'READY' || item.status === 'ERROR',
              )
              .map((item) => item.id),
          );
        }
      });
    };
    loadArchiveStatus();
    const timer = window.setInterval(loadArchiveStatus, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user]);

  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const processingItems = [
    ...localProcessingJobs,
    ...archiveItems
      .filter(
        (item) => item.status === 'PENDING' || item.status === 'PROCESSING',
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status as 'PENDING' | 'PROCESSING',
      })),
  ].filter(
    (job, index, jobs) =>
      jobs.findIndex((candidate) => candidate.id === job.id) === index,
  );

  useEffect(() => {
    setOpen(false);
    setBroadcastOpen(false);
    setMessagesOpen(false);
    setNotificationsOpen(false);
    setProcessingOpen(false);
  }, [pathname]);

  return (
    <header className="border-border bg-background-secondary sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-2 sm:px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {showMenuButton ? (
          <button
            type="button"
            className={iconBtnClass}
            aria-label="Open menu"
            onClick={onOpenMenu}
          >
            <MenuIcon size={18} />
          </button>
        ) : null}
        <TahtiLogoLink />
        {user && processingItems.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              className="border-accent-blue/50 bg-accent-blue/10 text-accent-blue inline-flex size-7 items-center justify-center rounded-full border"
              aria-label={`${processingItems.length} track${processingItems.length === 1 ? '' : 's'} processing`}
              aria-expanded={processingOpen}
              title="Track processing status"
              onClick={() => setProcessingOpen((current) => !current)}
            >
              <span className="bg-accent-blue size-2 rounded-full motion-safe:animate-pulse" />
            </button>
            {processingOpen ? (
              <div className="border-border bg-background absolute top-[calc(100%+8px)] left-0 z-40 w-72 rounded-lg border p-2 shadow-lg">
                <p className="text-foreground-secondary px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
                  Processing tracks
                </p>
                <ul className="flex flex-col gap-1">
                  {processingItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/studio/sounds/$id"
                        params={{ id: item.id }}
                        className="hover:bg-background-secondary flex items-center justify-between gap-3 rounded-md px-2 py-2 text-xs"
                        onClick={() => setProcessingOpen(false)}
                      >
                        <span className="min-w-0 truncate">{item.title}</span>
                        <span className="text-accent-blue shrink-0">
                          {item.status === 'PENDING' ? 'Queued' : 'Processing'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-foreground-secondary px-2 pt-2 text-[11px]">
                  This status updates automatically. You’ll get a notification
                  when a track is ready.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="hidden items-center gap-0.5 sm:flex">
          <button
            type="button"
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
          </button>
          <button
            type="button"
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
          </button>
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center px-4 sm:flex">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1" ref={popupRef}>
        {user && hasChannel ? (
          <>
            <div className="relative hidden sm:block">
              <button
                type="button"
                className={cn(
                  iconBtnClass,
                  (broadcastOpen || pathname.startsWith('/studio/go-live')) &&
                    'border-primary bg-primary/15 text-primary',
                  broadcastToneClass,
                )}
                aria-label={`Open live panel — ${broadcast.label}`}
                aria-haspopup="menu"
                aria-expanded={broadcastOpen}
                title="Broadcast status"
                data-tour-id="topbar-golive"
                onClick={() => {
                  setBroadcastOpen((current) => !current);
                  setMessagesOpen(false);
                  setNotificationsOpen(false);
                }}
              >
                <RadioIcon size={16} />
              </button>
              {broadcastOpen ? (
                <div
                  className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 min-w-52 rounded-lg border p-2 shadow-lg"
                  role="menu"
                >
                  <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        broadcastTone === 'healthy'
                          ? 'bg-accent-green'
                          : broadcastTone === 'error'
                            ? 'bg-accent-red'
                            : broadcastTone === 'warning'
                              ? 'bg-accent-yellow'
                              : broadcast.kind === 'rotation'
                                ? 'bg-accent-cyan'
                                : 'bg-foreground-secondary/40',
                        (broadcastTone !== 'idle' &&
                          'motion-safe:animate-pulse') ||
                          '',
                      )}
                      aria-hidden
                    />
                    {broadcast.label}
                  </div>
                  <Link
                    to="/studio/go-live"
                    role="menuitem"
                    onClick={() => setBroadcastOpen(false)}
                    className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2 py-2 text-xs"
                  >
                    <RadioIcon size={14} aria-hidden />
                    Open broadcast studio
                  </Link>
                  {user?.username ? (
                    <Link
                      to="/u/$username/green-room"
                      params={{ username: user.username }}
                      role="menuitem"
                      onClick={() => setBroadcastOpen(false)}
                      className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2 py-2 text-xs"
                    >
                      <MessageSquareIcon size={14} aria-hidden />
                      Open Green Room chat
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className={cn('hidden sm:inline-flex', iconBtnClass)}
              aria-label="Open upload"
              title="Open upload"
              data-tour-id="topbar-upload"
              onClick={() => setUploadOpen(true)}
            >
              <UploadIcon size={16} />
            </button>
          </>
        ) : null}

        {user ? (
          <div className="relative">
            <button
              type="button"
              className={cn(
                iconBtnClass,
                'relative',
                notificationsOpen &&
                  'border-primary bg-primary/15 text-primary',
              )}
              aria-label="Notifications"
              aria-haspopup="menu"
              aria-expanded={notificationsOpen}
              title="Notifications"
              data-tour-id="topbar-notifications"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setBroadcastOpen(false);
                setMessagesOpen(false);
              }}
            >
              <BellIcon size={16} />
              {unreadNotifications.length > 0 ? (
                <Badge
                  variant="pill"
                  color="red"
                  className="absolute -top-1 -right-1 min-w-4 px-1 text-center text-[9px] font-bold"
                >
                  {Math.min(9, unreadNotifications.length)}
                </Badge>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div
                className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 w-72 rounded-lg border p-2 shadow-lg"
                role="menu"
              >
                <div className="px-2 py-1">
                  <span className="text-sm font-semibold">Notifications</span>
                </div>
                {notifications.length === 0 ? (
                  <EmptyState
                    size="sm"
                    title="No notifications yet"
                    className="py-3"
                  />
                ) : (
                  <ul className="tahti-hide-scrollbar flex max-h-80 flex-col gap-1 overflow-y-auto">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={cn(
                          'rounded-md px-2 py-2 text-xs',
                          notification.readAt
                            ? 'text-foreground-secondary'
                            : 'bg-primary/10',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            {notification.sticky && !notification.readAt ? (
                              <Badge
                                variant="pill"
                                color="yellow"
                                className="mb-1"
                              >
                                Needs acknowledgement
                              </Badge>
                            ) : null}
                            {notification.url ? (
                              <a
                                href={notification.url}
                                className="block hover:underline"
                                onClick={() => {
                                  if (
                                    !notification.readAt &&
                                    !notification.sticky
                                  ) {
                                    void acknowledgeNotification(
                                      notification.id,
                                    );
                                  }
                                }}
                              >
                                <span className="font-semibold">
                                  {notification.title}
                                </span>
                                {notification.body ? (
                                  <span className="mt-0.5 block">
                                    {notification.body}
                                  </span>
                                ) : null}
                              </a>
                            ) : (
                              <>
                                <span className="font-semibold">
                                  {notification.title}
                                </span>
                                {notification.body ? (
                                  <span className="mt-0.5 block">
                                    {notification.body}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                          {notification.sticky && !notification.readAt ? (
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() =>
                                void acknowledgeNotification(notification.id)
                              }
                            >
                              Acknowledge
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {user ? (
          <div className="relative">
            <button
              type="button"
              className={cn(
                iconBtnClass,
                'relative',
                (messagesOpen || pathname.startsWith('/messages')) &&
                  'border-primary bg-primary/15 text-primary',
              )}
              aria-label="Messages"
              aria-haspopup="menu"
              aria-expanded={messagesOpen}
              title="Messages"
              data-tour-id="topbar-messages"
              onClick={() => {
                setMessagesOpen((current) => !current);
                setBroadcastOpen(false);
                setNotificationsOpen(false);
              }}
            >
              <MessageSquareIcon size={16} />
              {conversations.reduce(
                (total, conversation) => total + conversation.unreadCount,
                0,
              ) > 0 ? (
                <Badge
                  variant="pill"
                  color="red"
                  className="absolute -top-1 -right-1 min-w-4 px-1 text-center text-[9px] font-bold"
                >
                  {Math.min(
                    9,
                    conversations.reduce(
                      (total, conversation) => total + conversation.unreadCount,
                      0,
                    ),
                  )}
                </Badge>
              ) : null}
            </button>
            {messagesOpen ? (
              <div
                className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 w-72 rounded-lg border p-2 shadow-lg"
                role="menu"
              >
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm font-semibold">Messages</span>
                  <Link
                    to="/messages"
                    role="menuitem"
                    onClick={() => setMessagesOpen(false)}
                    className="text-accent-cyan text-xs hover:underline"
                  >
                    Open all
                  </Link>
                </div>
                {conversations.length === 0 ? (
                  <p className="text-foreground-secondary px-2 py-3 text-xs">
                    No messages yet.
                  </p>
                ) : (
                  conversations.slice(0, 5).map((conversation) => (
                    <Link
                      key={conversation.id}
                      to="/messages/$id"
                      params={{ id: conversation.id }}
                      role="menuitem"
                      onClick={() => setMessagesOpen(false)}
                      className={cn(
                        'hover:bg-background-secondary flex gap-2 rounded-md px-2 py-2 text-xs',
                        conversation.unreadCount > 0 && 'bg-accent-purple/10',
                      )}
                    >
                      <span className="bg-primary/20 text-primary flex size-7 shrink-0 items-center justify-center rounded-full font-semibold">
                        {conversation.otherUser.displayName
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 font-medium">
                          <span className="truncate">
                            {conversation.otherUser.displayName}
                          </span>
                          {conversation.unreadCount > 0 ? (
                            <Badge variant="pill" color="red">
                              {conversation.unreadCount}
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-foreground-secondary block truncate">
                          {conversation.lastMessage?.body ?? 'No messages yet'}
                        </span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              data-tour-id="topbar-account"
              className={cn(
                'hover:bg-background-secondary inline-flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition-colors',
                open
                  ? 'border-border bg-background-secondary'
                  : 'border-border/60',
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
              <span
                className="text-foreground-secondary text-[10px]"
                aria-hidden
              >
                {open ? '▴' : '▾'}
              </span>
            </button>

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

                <button
                  type="button"
                  className="hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    openSettings('account');
                  }}
                >
                  <SettingsIcon size={14} />
                  Settings
                </button>
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
                <button
                  type="button"
                  className="text-accent-red hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                >
                  <LogOutIcon size={14} />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className={iconBtnClass}
            aria-label="Log in"
            title="Log in"
            data-tour-id="topbar-login"
            onClick={() => openAuth('login')}
          >
            <LogInIcon size={16} />
          </button>
        )}
      </div>
      <UploadTrackDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </header>
  );
}
