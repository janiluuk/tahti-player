import { Bell, ListMusicIcon, MessageCircle } from 'lucide-react';

import { Badge, Button, QueuePanel, Tooltip } from '@tahti-player/ui';

import { useLayoutStore, type RightRailTab } from '../stores/layoutStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { usePlayerStore } from '../stores/playerStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { ChannelChatPanel } from './ChannelChatPanel';
import {
  RightRailNotificationList,
  useUnreadNotifications,
} from './RightRailNotificationList';
import { SidebarQueuePanel } from './SidebarQueuePanel';

const COLLAPSED_LABELS = {
  removeButton: 'Remove from queue',
  playbackError: 'Could not play',
};

export function RightRailPanel({ isCollapsed }: { isCollapsed: boolean }) {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const tab = useLayoutStore((s) => s.rightRailTab);
  const toggleRight = useLayoutStore((s) => s.toggleRight);

  if (isCollapsed) {
    if (railOverride) {
      return (
        <Tooltip content={`Open ${railOverride.title}`} side="left">
          <Button
            size="icon-sm"
            variant="text"
            className="mx-auto"
            aria-label={`Open ${railOverride.title}`}
            onClick={() => toggleRight()}
          >
            <ListMusicIcon size={18} aria-hidden />
          </Button>
        </Tooltip>
      );
    }
    return <CollapsedQueueBar />;
  }

  if (railOverride) {
    return (
      <div
        className="flex h-full min-h-0 flex-col"
        data-testid="right-rail"
        data-right-rail-override={railOverride.title}
      >
        <div className="border-border shrink-0 border-b px-2 py-2">
          <p className="text-xs font-bold tracking-wide uppercase">
            {railOverride.title}
          </p>
        </div>
        <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
          {railOverride.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="right-rail"
      data-right-rail-view={tab}
    >
      <RightRailBody tab={tab} />
    </div>
  );
}

function RightRailBody({ tab }: { tab: RightRailTab }) {
  const chatSlug = useLayoutStore((s) => s.chatSlug);
  const chatEnabled = useLayoutStore((s) => s.chatEnabled);
  const chatDisabledReason = useLayoutStore((s) => s.chatDisabledReason);
  const acknowledge = useNotificationInboxStore((s) => s.acknowledge);
  const notifications = useUnreadNotifications();

  if (tab === 'notifications') {
    return (
      <RightRailNotificationList
        notifications={notifications}
        onRead={(id) => {
          void acknowledge(id);
        }}
      />
    );
  }

  if (tab === 'chat') {
    if (chatEnabled && chatSlug) {
      return <ChannelChatPanel slug={chatSlug} rail />;
    }
    return (
      <div className="text-foreground-secondary flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
        <MessageCircle size={40} className="opacity-40" />
        <p className="text-foreground font-semibold">Chat unavailable</p>
        <p className="text-xs opacity-70">
          {chatDisabledReason ?? 'Open a channel with chat enabled.'}
        </p>
      </div>
    );
  }

  return <SidebarQueuePanel toolbar={false} />;
}

/** Nuclear's collapsed rail: queue artwork only, plus chat/notification entry points. */
function CollapsedQueueBar() {
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const setRightRailTab = useLayoutStore((s) => s.setRightRailTab);
  const toggleRight = useLayoutStore((s) => s.toggleRight);
  const unreadCount = useUnreadNotifications().length;

  const open = (view: RightRailTab) => {
    setRightRailTab(view);
    toggleRight();
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col items-center"
      data-testid="right-rail"
      data-right-rail-collapsed
    >
      <div className="min-h-0 w-full flex-1">
        {queue.length > 0 ? (
          <QueuePanel
            items={queue}
            currentItemId={currentId ?? undefined}
            isCollapsed
            reorderable={false}
            onSelectItem={playQueueIndex}
            labels={COLLAPSED_LABELS}
          />
        ) : (
          <Tooltip content="Open queue" side="left">
            <Button
              size="icon-sm"
              variant="text"
              className="text-foreground-secondary mx-auto flex"
              aria-label="Open queue"
              onClick={() => open('queue')}
            >
              <ListMusicIcon size={18} aria-hidden />
            </Button>
          </Tooltip>
        )}
      </div>
      <div className="border-border flex shrink-0 flex-col items-center gap-1 border-t py-2">
        <Tooltip content="Open chat" side="left">
          <Button
            size="icon-sm"
            variant="text"
            className="text-foreground-secondary"
            aria-label="Open chat"
            onClick={() => open('chat')}
          >
            <MessageCircle size={18} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Open notifications" side="left">
          <Button
            size="icon-sm"
            variant="text"
            className="text-foreground-secondary relative"
            aria-label="Open notifications"
            onClick={() => open('notifications')}
          >
            <Bell size={18} aria-hidden />
            {unreadCount > 0 ? (
              <Badge
                variant="pill"
                color="purple"
                className="absolute -top-1 -right-1 min-w-4 px-1 text-[10px] leading-4"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            ) : null}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
