import { Bell, Check, ListMusicIcon, MessageCircle } from 'lucide-react';

import { Badge, Button, EmptyState, Tabs } from '@tahti-player/ui';

import type { TahtiNotification } from '../api/notifications';
import { useLayoutStore, type RightRailTab } from '../stores/layoutStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { usePlayerStore } from '../stores/playerStore';
import { ChannelChatPanel } from './ChannelChatPanel';
import { SidebarQueuePanel } from './SidebarQueuePanel';

const TAB_INDEX: RightRailTab[] = ['chat', 'notifications', 'queue'];

export function RightRailPanel({ isCollapsed }: { isCollapsed: boolean }) {
  const chatSlug = useLayoutStore((s) => s.chatSlug);
  const chatEnabled = useLayoutStore((s) => s.chatEnabled);
  const chatDisabledReason = useLayoutStore((s) => s.chatDisabledReason);
  const tab = useLayoutStore((s) => s.rightRailTab);
  const setRightRailTab = useLayoutStore((s) => s.setRightRailTab);
  const notifications = useNotificationInboxStore((s) =>
    s.items.filter((item) => !item.readAt),
  );
  const acknowledgeNotification = useNotificationInboxStore(
    (s) => s.acknowledge,
  );
  const toggleRight = useLayoutStore((s) => s.toggleRight);
  const queueCount = usePlayerStore((s) => s.queue.length);

  const openTab = (next: RightRailTab) => {
    setRightRailTab(next);
    toggleRight();
  };

  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center gap-2 py-3">
        <button
          type="button"
          className={`text-foreground-secondary hover:text-foreground rounded-md p-1.5 ${tab === 'chat' ? 'bg-primary/15 text-primary' : ''}`}
          aria-label="Open chat"
          title="Open chat"
          onClick={() => openTab('chat')}
        >
          <MessageCircle size={18} />
        </button>
        <button
          type="button"
          className={`text-foreground-secondary hover:text-foreground relative rounded-md p-1.5 ${tab === 'notifications' ? 'bg-primary/15 text-primary' : ''}`}
          aria-label="Open notifications"
          title="Open notifications"
          onClick={() => openTab('notifications')}
        >
          <Bell size={18} />
          {notifications.length > 0 ? (
            <Badge
              variant="pill"
              color="red"
              className="absolute -top-1 -right-1 min-w-3 px-1 text-center text-[9px] leading-3"
            >
              {notifications.length}
            </Badge>
          ) : null}
        </button>
        <button
          type="button"
          className={`text-foreground-secondary hover:text-foreground relative rounded-md p-1.5 ${tab === 'queue' ? 'bg-primary/15 text-primary' : ''}`}
          aria-label="Open queue"
          title="Open queue"
          onClick={() => openTab('queue')}
        >
          <ListMusicIcon size={18} />
          {queueCount > 0 ? (
            <Badge
              variant="pill"
              color="secondary"
              className="absolute -top-1 -right-1 min-w-3 px-1 text-center text-[9px] leading-3"
            >
              {queueCount}
            </Badge>
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="right-rail">
      <Tabs.Root
        className="shrink-0 gap-0"
        selectedIndex={TAB_INDEX.indexOf(tab)}
        onChange={(index) => setRightRailTab(TAB_INDEX[index] ?? 'chat')}
      >
        <Tabs.List
          aria-label="Chat, notifications, and queue"
          className="border-border shrink-0 border-b px-2 py-1"
        >
          <Tabs.Tab>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={13} aria-hidden />
              Chat
            </span>
          </Tabs.Tab>
          <Tabs.Tab>
            <span className="inline-flex items-center gap-1">
              <Bell size={13} aria-hidden />
              Notifications
              {notifications.length > 0 ? (
                <Badge
                  variant="pill"
                  color="red"
                  className="ml-0.5 min-w-3 px-1.5 text-[9px] leading-3"
                >
                  {notifications.length}
                </Badge>
              ) : null}
            </span>
          </Tabs.Tab>
          <Tabs.Tab>
            <span className="inline-flex items-center gap-1">
              <ListMusicIcon size={13} aria-hidden />
              Queue
              {queueCount > 0 ? (
                <Badge
                  variant="pill"
                  color="secondary"
                  className="ml-0.5 min-w-3 px-1.5 text-[9px] leading-3"
                >
                  {queueCount}
                </Badge>
              ) : null}
            </span>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'queue' ? (
          <SidebarQueuePanel compact />
        ) : tab === 'notifications' ? (
          <NotificationList
            notifications={notifications}
            onRead={(id) => {
              void acknowledgeNotification(id);
            }}
          />
        ) : chatEnabled && chatSlug ? (
          <div className="flex h-full min-h-0 flex-col p-2">
            <ChannelChatPanel slug={chatSlug} rail />
          </div>
        ) : (
          <div className="text-foreground-secondary flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
            <MessageCircle size={40} className="opacity-40" />
            <p className="text-foreground font-semibold">Chat unavailable</p>
            <p className="text-xs opacity-70">
              {chatDisabledReason ?? 'Open a channel with chat enabled.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationList({
  notifications,
  onRead,
}: {
  notifications: TahtiNotification[];
  onRead: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<Check size={28} className="opacity-50" />}
        title="All caught up"
        className="h-full"
      />
    );
  }

  return (
    <ul className="tahti-hide-scrollbar flex h-full flex-col gap-2 overflow-y-auto p-2">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className="border-accent-purple/40 bg-accent-purple/10 rounded-md border-l-2 p-2 text-xs"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {notification.sticky ? (
                <Badge variant="pill" color="yellow" className="mb-1">
                  Needs acknowledgement
                </Badge>
              ) : null}
              <p className="font-semibold">{notification.title}</p>
              {notification.body ? (
                <p className="text-foreground-secondary mt-0.5">
                  {notification.body}
                </p>
              ) : null}
              <p className="text-foreground-secondary mt-1 text-[10px] opacity-70">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              size="icon-sm"
              variant="text"
              aria-label={
                notification.sticky
                  ? `Acknowledge ${notification.title}`
                  : `Mark ${notification.title} as seen`
              }
              title={notification.sticky ? 'Acknowledge' : 'Mark as seen'}
              onClick={() => onRead(notification.id)}
            >
              <Check size={14} />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
