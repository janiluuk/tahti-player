import { create } from 'zustand';

import { showNotificationToast, toast } from '@tahti-player/ui';

import {
  dismissNotification,
  fetchNotifications,
  markAllNotificationsRead,
  type TahtiNotification,
} from '../api/notifications';

const POLL_MS = 20_000;

type NotificationInboxState = {
  items: TahtiNotification[];
  unreadCount: number;
  hasMore: boolean;
  loadingOlder: boolean;
  load: (opts?: { toastNew?: boolean }) => Promise<void>;
  loadOlder: () => Promise<void>;
  acknowledge: (id: string) => Promise<void>;
  markNonStickyRead: () => Promise<void>;
  reset: () => void;
};

let seenIds = new Set<string>();
let initialLoadDone = false;
let pollTimer: number | null = null;

function presentToast(
  notification: TahtiNotification,
  onAcknowledge: (id: string) => void,
) {
  showNotificationToast(notification.title, {
    id: notification.id,
    description: notification.body ?? undefined,
    sticky: notification.sticky,
    actionLabel: notification.sticky ? 'Acknowledge' : undefined,
    onAction: notification.sticky
      ? () => void onAcknowledge(notification.id)
      : undefined,
  });
}

export const useNotificationInboxStore = create<NotificationInboxState>(
  (set, get) => ({
    items: [],
    unreadCount: 0,
    hasMore: false,
    loadingOlder: false,

    load: async (opts) => {
      const toastNew = opts?.toastNew ?? true;
      const result = await fetchNotifications();
      const previousSeen = seenIds;
      const nextSeen = new Set(result.data.map((item) => item.id));
      const unread = result.data.filter((item) => !item.readAt);

      if (!initialLoadDone) {
        for (const notification of unread.filter((item) => item.sticky)) {
          presentToast(notification, (id) => void get().acknowledge(id));
        }
        initialLoadDone = true;
      } else if (toastNew) {
        for (const notification of unread) {
          if (!previousSeen.has(notification.id)) {
            presentToast(notification, (id) => void get().acknowledge(id));
          }
        }
      }

      seenIds = nextSeen;
      const latestIds = new Set(result.data.map((item) => item.id));
      const oldestLatest = result.data.at(-1)?.createdAt;
      const olderKept = oldestLatest
        ? get().items.filter(
            (item) => !latestIds.has(item.id) && item.createdAt < oldestLatest,
          )
        : [];
      set({
        items: [...result.data, ...olderKept],
        unreadCount: result.unreadCount,
        hasMore: olderKept.length > 0 ? get().hasMore : result.hasMore,
      });
    },

    loadOlder: async () => {
      const oldest = get().items.at(-1);
      if (!oldest || get().loadingOlder) {
        return;
      }
      set({ loadingOlder: true });
      const result = await fetchNotifications(oldest.id);
      const known = new Set(get().items.map((item) => item.id));
      set((state) => ({
        items: [
          ...state.items,
          ...result.data.filter((item) => !known.has(item.id)),
        ],
        hasMore: result.hasMore,
        loadingOlder: false,
      }));
    },

    acknowledge: async (id) => {
      await dismissNotification(id);
      toast.dismiss(id);
      const readAt = new Date().toISOString();
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, readAt } : item,
        ),
        unreadCount: state.items.some((item) => item.id === id && !item.readAt)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    },

    markNonStickyRead: async () => {
      const hasUnstickyUnread = get().items.some(
        (item) => !item.readAt && !item.sticky,
      );
      if (!hasUnstickyUnread) {
        return;
      }
      const readAt = new Date().toISOString();
      set((state) => ({
        items: state.items.map((item) =>
          item.sticky || item.readAt ? item : { ...item, readAt },
        ),
        unreadCount: state.items.filter((item) => item.sticky && !item.readAt)
          .length,
      }));
      await markAllNotificationsRead();
    },

    reset: () => {
      seenIds = new Set();
      initialLoadDone = false;
      toast.dismiss();
      set({ items: [], unreadCount: 0, hasMore: false, loadingOlder: false });
    },
  }),
);

export function startNotificationInboxPolling(): () => void {
  void useNotificationInboxStore.getState().load();
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
  }
  const tick = () => {
    if (document.visibilityState === 'visible') {
      void useNotificationInboxStore.getState().load();
    }
  };
  pollTimer = window.setInterval(tick, POLL_MS);
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    if (pollTimer != null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}
