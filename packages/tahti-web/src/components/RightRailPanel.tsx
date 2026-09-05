import { Bell, Check, ListMusicIcon, MessageCircle } from 'lucide-react';
import { useMemo } from 'react';

import {
  Badge,
  Button,
  EmptyState,
  TabLabel,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import type { TahtiNotification } from '../api/notifications';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLayoutStore, type RightRailTab } from '../stores/layoutStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { usePlayerStore } from '../stores/playerStore';
import { ChannelChatPanel } from './ChannelChatPanel';
import { SidebarQueuePanel } from './SidebarQueuePanel';

const DESKTOP_TABS: RightRailTab[] = ['chat', 'notifications', 'queue'];
const MOBILE_TABS: RightRailTab[] = ['chat', 'notifications', 'queue'];

const COLLAPSED_TAB_CLASS =
  'relative size-9 shrink-0 rounded-md p-0 data-[selected]:bg-primary/15 data-[selected]:text-primary';

export function RightRailPanel({ isCollapsed }: { isCollapsed: boolean }) {
  const isMobile = useIsMobile();
  const chatSlug = useLayoutStore((s) => s.chatSlug);
  const chatEnabled = useLayoutStore((s) => s.chatEnabled);
  const chatDisabledReason = useLayoutStore((s) => s.chatDisabledReason);
  const tab = useLayoutStore((s) => s.rightRailTab);
  const setRightRailTab = useLayoutStore((s) => s.setRightRailTab);
  // Select the raw array (stable reference, only changes on store `set()`)
  // and derive the filtered list with useMemo. An inline `.filter()` inside
  // the selector itself returns a new array every call, which trips React's
  // "getSnapshot should be cached" infinite-render-loop guard as soon as
  // this component mounts (crashed every post-login render — see
  // docs/todo/login-infinite-loop-crash.md).
  const notificationItems = useNotificationInboxStore((s) => s.items);
  const notifications = useMemo(
    () => notificationItems.filter((item) => !item.readAt),
    [notificationItems],
  );
  const acknowledgeNotification = useNotificationInboxStore(
    (s) => s.acknowledge,
  );
  const toggleRight = useLayoutStore((s) => s.toggleRight);
  const queueCount = usePlayerStore((s) => s.queue.length);
  const tabs = isMobile ? MOBILE_TABS : DESKTOP_TABS;

  const openTab = (next: RightRailTab) => {
    setRightRailTab(next);
    toggleRight();
  };

  const selectedIndex = Math.max(0, tabs.indexOf(tab));

  if (isCollapsed) {
    return (
      <Tabs.Root
        vertical
        selectedIndex={selectedIndex}
        onChange={(index) => openTab(tabs[index] ?? 'chat')}
        className="h-full"
        listClassName="flex-col items-center gap-2 py-3"
        tabClassName={COLLAPSED_TAB_CLASS}
      >
        <Tabs.List
          aria-label="Chat, notifications, and queue"
          className="w-auto flex-col"
        >
          <Tabs.Tab aria-label="Open chat" title="Open chat">
            <TabLabel icon={<MessageCircle size={18} />}>
              <span className="sr-only">Chat</span>
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab aria-label="Open notifications" title="Open notifications">
            <TabLabel
              icon={<Bell size={18} />}
              count={
                notifications.length > 0 ? notifications.length : undefined
              }
            >
              <span className="sr-only">Notifications</span>
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab aria-label="Open queue" title="Open queue">
            <TabLabel
              icon={<ListMusicIcon size={18} />}
              count={queueCount > 0 ? queueCount : undefined}
            >
              <span className="sr-only">Queue</span>
            </TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="right-rail">
      <Tabs.Root
        selectedIndex={selectedIndex}
        onChange={(index) => setRightRailTab(tabs[index] ?? 'chat')}
      >
        <Tabs.List
          aria-label="Chat, notifications, and queue"
          className="border-border shrink-0 border-b px-2 py-1"
        >
          <Tabs.Tab>
            <TabLabel icon={<MessageCircle size={13} />}>Chat</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel
              icon={<Bell size={13} />}
              count={
                notifications.length > 0 ? notifications.length : undefined
              }
            >
              Notifications
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel
              icon={<ListMusicIcon size={13} />}
              count={queueCount > 0 ? queueCount : undefined}
            >
              Queue
            </TabLabel>
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
            <Tooltip
              content={notification.sticky ? 'Acknowledge' : 'Mark as seen'}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="text"
                aria-label={
                  notification.sticky
                    ? `Acknowledge ${notification.title}`
                    : `Mark ${notification.title} as seen`
                }
                onClick={() => onRead(notification.id)}
              >
                <Check size={14} />
              </Button>
            </Tooltip>
          </div>
        </li>
      ))}
    </ul>
  );
}
