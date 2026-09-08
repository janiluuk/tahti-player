import { Link } from '@tanstack/react-router';
import {
  BellIcon,
  HardDriveIcon,
  LoaderCircleIcon,
  MessageSquareIcon,
  MusicIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { BottomBar, cn, Tooltip } from '@tahti-player/ui';

import { fetchConversations } from '../api/messages';
import { fetchStudioSounds } from '../api/studio';
import { fetchStorageUsage } from '../api/studio-extras';
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

function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export type StatusBarContentProps = {
  soundCount: number;
  unreadNotifications: number;
  unreadMessages: number;
  encodingLabel: string | null;
  storageUsedLabel?: string | null;
  className?: string;
};

/** Presentational Status Bar body matching Storybook BottomBar / StatusBar. */
export function StatusBarContent({
  soundCount,
  unreadNotifications,
  unreadMessages,
  encodingLabel,
  storageUsedLabel,
  className,
}: StatusBarContentProps) {
  const soundsLabel = `${soundCount.toLocaleString()} sound${soundCount === 1 ? '' : 's'}`;
  const notificationsLabel =
    unreadNotifications === 0
      ? 'No new notifications'
      : `${unreadNotifications.toLocaleString()} new notification${unreadNotifications === 1 ? '' : 's'}`;
  const messagesLabel =
    unreadMessages === 0
      ? 'No unread messages'
      : `${unreadMessages.toLocaleString()} unread message${unreadMessages === 1 ? '' : 's'}`;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-4 text-sm',
        className,
      )}
      data-testid="status-bar-content"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <Tooltip content={soundsLabel} side="top">
          <Link
            to="/library/sounds"
            className="text-foreground hover:bg-background-secondary inline-flex items-center gap-1.5 rounded-md px-1.5 py-1"
            data-testid="status-bar-sounds"
            aria-label={soundsLabel}
          >
            <MusicIcon size={16} aria-hidden />
            <span className="tabular-nums">{soundCount.toLocaleString()}</span>
          </Link>
        </Tooltip>
        <Tooltip content={notificationsLabel} side="top">
          <span
            className="text-foreground-secondary inline-flex items-center gap-1.5 px-1.5 py-1"
            data-testid="status-bar-notifications"
            aria-label={notificationsLabel}
          >
            <BellIcon size={16} aria-hidden />
            <span className="tabular-nums">
              {unreadNotifications.toLocaleString()}
            </span>
          </span>
        </Tooltip>
        <Tooltip content={messagesLabel} side="top">
          <Link
            to="/messages"
            className="text-foreground-secondary hover:text-foreground hover:bg-background-secondary inline-flex items-center gap-1.5 rounded-md px-1.5 py-1"
            data-testid="status-bar-messages"
            aria-label={messagesLabel}
          >
            <MessageSquareIcon size={16} aria-hidden />
            <span className="tabular-nums">
              {unreadMessages.toLocaleString()}
            </span>
          </Link>
        </Tooltip>
        {storageUsedLabel ? (
          <Tooltip
            content={`Cloud storage used: ${storageUsedLabel}`}
            side="top"
          >
            <Link
              to="/settings/$section"
              params={{ section: 'account' }}
              className="text-foreground-secondary hover:text-foreground hover:bg-background-secondary inline-flex items-center gap-1.5 rounded-md px-1.5 py-1"
              data-testid="status-bar-storage"
              aria-label={`Cloud storage used: ${storageUsedLabel}`}
            >
              <HardDriveIcon size={16} aria-hidden />
              <span className="tabular-nums">{storageUsedLabel}</span>
            </Link>
          </Tooltip>
        ) : null}
      </div>
      {encodingLabel ? (
        <div
          className="flex shrink-0 items-center gap-3"
          data-testid="status-bar-encoding"
        >
          <Tooltip content={encodingLabel} side="top">
            <span
              className="text-foreground-secondary inline-flex max-w-48 items-center gap-1.5 truncate sm:max-w-xs"
              aria-label={encodingLabel}
            >
              <LoaderCircleIcon
                size={16}
                aria-hidden
                className="shrink-0 animate-spin"
              />
              <span className="truncate">{encodingLabel}</span>
            </span>
          </Tooltip>
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
  const [storageUsedLabel, setStorageUsedLabel] = useState<string | null>(null);

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
    void fetchStorageUsage().then((result) => {
      setStorageUsedLabel(formatStorageBytes(result.data.usedBytes));
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
          storageUsedLabel={storageUsedLabel}
        />
      </div>
    </BottomBar>
  );
}
