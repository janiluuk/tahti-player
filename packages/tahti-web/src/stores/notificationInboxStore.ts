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
  load: (opts?: { toastNew?: boolean }) => Promise<void>;
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
      set({ items: result.data });
    },

    acknowledge: async (id) => {
      await dismissNotification(id);
      toast.dismiss(id);
      const readAt = new Date().toISOString();
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, readAt } : item,
        ),
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
      }));
      await markAllNotificationsRead();
    },

    reset: () => {
      seenIds = new Set();
      initialLoadDone = false;
      toast.dismiss();
      set({ items: [] });
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
