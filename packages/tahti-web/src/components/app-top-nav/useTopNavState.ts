import {
  useCanGoBack,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import {
  fetchConversations,
  type ConversationSummary,
} from '../../api/messages';
import { fetchStudioSounds } from '../../api/studio';
import { type StudioSound } from '../../api/studio-types';
import { useCanGoForward } from '../../hooks/useCanGoForward';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useOwnBroadcastPresence } from '../../hooks/useOwnBroadcastPresence';
import { usePolling } from '../../hooks/usePolling';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationInboxStore } from '../../stores/notificationInboxStore';
import { useProcessingJobsStore } from '../../stores/processingJobsStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';

export function useTopNavState() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();
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
  const [streamManagerOpen, setStreamManagerOpen] = useState(false);
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
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
  const [soundItems, setSoundItems] = useState<StudioSound[]>([]);
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
  // channelState === 'LIVE' with no ingest signal is the normal state for
  // a channel whose 24/7 fallback rotation is carrying it — not an error.
  // (See resolveBroadcastPresence's own comment: only signal + LIVE is a
  // real broadcast.) Only `live` gets to flash/pulse; rotation and
  // preview are informational, not alarms.
  const isRotation = broadcast.kind === 'rotation';
  const hasBroadcastWarning = broadcast.kind === 'preview';
  const broadcastTone = isLive
    ? 'healthy'
    : isRotation
      ? 'rotation'
      : hasBroadcastWarning
        ? 'warning'
        : 'idle';
  const broadcastToneClass = {
    healthy:
      'border-accent-green/70 bg-accent-green/15 text-accent-green motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]',
    rotation: 'border-accent-yellow/70 bg-accent-yellow/15 text-accent-yellow',
    warning: 'border-accent-yellow/70 bg-accent-yellow/15 text-accent-yellow',
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

  const loadSoundStatus = () => {
    if (!user) {
      return;
    }
    void fetchStudioSounds().then((result) => {
      setSoundItems(result.data);
      settleProcessingJobs(
        result.data
          .filter((item) => item.status === 'READY' || item.status === 'ERROR')
          .map((item) => item.id),
      );
    });
  };

  usePolling(loadSoundStatus, 5000, Boolean(user));

  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  );
  const unreadMessagesCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );
  const processingItems = [
    ...localProcessingJobs,
    ...soundItems
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

  return {
    pathname,
    isMobile,
    router,
    canGoBack,
    canGoForward,
    user,
    logout,
    openAuth,
    openSettings,
    open,
    setOpen,
    uploadOpen,
    setUploadOpen,
    broadcastOpen,
    setBroadcastOpen,
    streamManagerOpen,
    setStreamManagerOpen,
    bookingCalendarOpen,
    setBookingCalendarOpen,
    messagesOpen,
    setMessagesOpen,
    notificationsOpen,
    setNotificationsOpen,
    processingOpen,
    setProcessingOpen,
    conversations,
    setConversations,
    notifications,
    acknowledgeNotification,
    markNonStickyRead,
    soundItems,
    setSoundItems,
    localProcessingJobs,
    settleProcessingJobs,
    menuRef,
    popupRef,
    hasChannel,
    broadcast,
    isLive,
    isRotation,
    hasBroadcastWarning,
    broadcastTone,
    broadcastToneClass,
    displayName,
    initial,
    loadSoundStatus,
    unreadNotifications,
    unreadMessagesCount,
    processingItems,
  };
}

export type TopNavState = ReturnType<typeof useTopNavState>;
