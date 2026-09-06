import { Link } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { BottomBar, cn } from '@tahti-player/ui';

import { fetchConversations } from '../api/messages';
import { fetchStudioSounds } from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { usePolling } from '../hooks/usePolling';
import {
  encodingStatusLabel,
  mergeProcessingItems,
  shouldShowConnectedStatusBar,
} from '../lib/processingItems';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { useProcessingJobsStore } from '../stores/processingJobsStore';

const POLL_MS = 5000;

export type StatusBarContentProps = {
  soundCount: number;
  unreadNotifications: number;
  unreadMessages: number;
  encodingLabel: string | null;
  className?: string;
};

/** Presentational Status Bar body matching Storybook BottomBar / StatusBar. */
export function StatusBarContent({
  soundCount,
  unreadNotifications,
  unreadMessages,
  encodingLabel,
  className,
}: StatusBarContentProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-4 text-sm',
        className,
      )}
      data-testid="status-bar-content"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <Link
          to="/library/sounds"
          className="text-foreground hover:underline"
          data-testid="status-bar-sounds"
        >
          ♪ {soundCount.toLocaleString()} sound
          {soundCount === 1 ? '' : 's'}
        </Link>
        <span className="text-foreground-secondary" aria-hidden>
          •
        </span>
        <span
          className="text-foreground-secondary"
          data-testid="status-bar-notifications"
        >
          {unreadNotifications === 0
            ? 'No new notifications'
            : `${unreadNotifications.toLocaleString()} new notification${unreadNotifications === 1 ? '' : 's'}`}
        </span>
        <span className="text-foreground-secondary" aria-hidden>
          •
        </span>
        <Link
          to="/messages"
          className="text-foreground-secondary hover:text-foreground hover:underline"
          data-testid="status-bar-messages"
        >
          {unreadMessages === 0
            ? 'No unread messages'
            : `${unreadMessages.toLocaleString()} unread message${unreadMessages === 1 ? '' : 's'}`}
        </Link>
      </div>
      {encodingLabel ? (
        <div
          className="flex shrink-0 items-center gap-4"
          data-testid="status-bar-encoding"
        >
          <span className="text-foreground-secondary max-w-48 truncate sm:max-w-xs">
            {encodingLabel}
          </span>
          <div
            className="bg-background-secondary h-1 w-32 overflow-hidden rounded-full"
            role="progressbar"
            aria-label={encodingLabel}
            aria-valuetext={encodingLabel}
          >
            <div className="bg-accent-green h-1 w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Bottom Status Bar when the compact player is not showing (signed-in). */
export function ConnectedStatusBar() {
  const user = useAuthStore((state) => state.user);
  const queue = usePlayerStore((state) => state.queue);
  const currentId = usePlayerStore((state) => state.currentId);
  const playerBarVisible = usePlayerStore((state) => state.playerBarVisible);
  const fullScreenPlayerOpen = useLayoutStore(
    (state) => state.fullScreenPlayerOpen,
  );
  const localProcessingJobs = useProcessingJobsStore((state) => state.jobs);
  const settleProcessingJobs = useProcessingJobsStore((state) => state.settle);
  const notifications = useNotificationInboxStore((state) => state.items);

  const [archiveItems, setArchiveItems] = useState<StudioSound[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const current = queue.find((item) => item.id === currentId);
  const playable = current ? playableFromQueueItem(current) : null;

  const visible = shouldShowConnectedStatusBar({
    signedIn: Boolean(user),
    playerBarVisible,
    hasPlayable: Boolean(playable),
    fullScreenPlayerOpen,
  });

  const load = useCallback(() => {
    if (!user || !visible) {
      return;
    }
    void fetchStudioSounds().then((result) => {
      setArchiveItems(result.data);
      settleProcessingJobs(
        result.data
          .filter((item) => item.status === 'READY' || item.status === 'ERROR')
          .map((item) => item.id),
      );
    });
    void fetchConversations().then((result) => {
      setUnreadMessages(
        result.data.reduce(
          (total, conversation) => total + conversation.unreadCount,
          0,
        ),
      );
    });
  }, [user, visible, settleProcessingJobs]);

  usePolling(load, POLL_MS, Boolean(user && visible));

  if (!visible) {
    return null;
  }

  const processingItems = mergeProcessingItems(
    localProcessingJobs,
    archiveItems,
  );
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  return (
    <BottomBar className="px-5">
      <div className="w-full" data-testid="connected-status-bar">
        <StatusBarContent
          soundCount={archiveItems.length}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          encodingLabel={encodingStatusLabel(processingItems)}
        />
      </div>
    </BottomBar>
  );
}
