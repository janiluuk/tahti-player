import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiNotification } from '@tahti-web/api/notifications';
import { RightRailHeaderActions } from '@tahti-web/components/RightRailHeaderActions';
import { RightRailPanel } from '@tahti-web/components/RightRailPanel';
import {
  useLayoutStore,
  type RightRailTab,
} from '@tahti-web/stores/layoutStore';
import { useNotificationInboxStore } from '@tahti-web/stores/notificationInboxStore';
import { usePlayerStore } from '@tahti-web/stores/playerStore';

import type { QueueItem } from '@tahti-player/model';
import { PlayerWorkspace } from '@tahti-player/ui';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

function mockQueueItem(
  id: string,
  title: string,
  artist: string,
  durationMs: number,
): QueueItem {
  return {
    id,
    track: {
      title,
      artists: [{ name: artist, roles: ['performer'] }],
      durationMs,
      source: { provider: 'tahti', id },
      artwork: {
        items: [
          { url: `https://picsum.photos/seed/${id}/128`, purpose: 'cover' },
        ],
      },
    },
    status: 'idle',
    addedAtIso: new Date().toISOString(),
  };
}

const QUEUE: QueueItem[] = [
  mockQueueItem('archive:1', "I Can't Sleep", 'Eric404', 201000),
  mockQueueItem('archive:2', 'Midnight Drift', 'Northern Lights', 245000),
  mockQueueItem('archive:3', 'Static Bloom', 'Halcyon Field', 198000),
  mockQueueItem('archive:4', 'Low Tide', 'Northern Lights', 312000),
];

const LONG_QUEUE: QueueItem[] = Array.from({ length: 60 }, (_, i) =>
  mockQueueItem(
    `archive:long-${i}`,
    `Track ${i + 1}`,
    i % 2 ? 'Halcyon Field' : 'Northern Lights',
    180000 + i * 1000,
  ),
);

const NOTIFICATIONS: TahtiNotification[] = [
  {
    id: 'n1',
    type: 'system',
    actor: null,
    title: 'Terms updated',
    body: 'Please review the updated membership terms.',
    url: null,
    readAt: null,
    sticky: true,
    createdAt: '2026-09-25T09:00:00.000Z',
  },
  {
    id: 'n2',
    type: 'follow',
    actor: null,
    title: 'Northern Lights went live',
    body: null,
    url: null,
    readAt: null,
    sticky: false,
    createdAt: '2026-09-25T08:30:00.000Z',
  },
];

type Seed = {
  tab?: RightRailTab;
  queue?: QueueItem[];
  currentId?: string | null;
  notifications?: TahtiNotification[];
  chatSlug?: string | null;
  chatEnabled?: boolean;
  chatDisabledReason?: string | null;
};

/** RightRailPanel and its header read stores directly, not props. */
function withRailState(seed: Seed = {}): Decorator {
  return (Story) => {
    const queue = seed.queue ?? QUEUE;
    usePlayerStore.setState({
      queue,
      currentId:
        seed.currentId === undefined ? (queue[0]?.id ?? null) : seed.currentId,
    });
    useNotificationInboxStore.setState({ items: seed.notifications ?? [] });
    useLayoutStore.setState({
      rightRailTab: seed.tab ?? 'queue',
      chatSlug: seed.chatSlug ?? null,
      chatEnabled: seed.chatEnabled ?? false,
      chatDisabledReason: seed.chatDisabledReason ?? null,
    });
    return <Story />;
  };
}

/** Mounted the way AppShell does: sidebar shell + header actions + body. */
function QueueBar({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex h-[36rem] justify-end">
      <PlayerWorkspace.RightSidebar
        width={340}
        isCollapsed={isCollapsed}
        onWidthChange={() => {}}
        onToggle={() => {}}
        headerActions={<RightRailHeaderActions />}
      >
        <RightRailPanel isCollapsed={isCollapsed} />
      </PlayerWorkspace.RightSidebar>
    </div>
  );
}

const meta: Meta<typeof QueueBar> = {
  title: 'Tahti/Misc/RightRailPanel',
  component: QueueBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'tahti-web right rail as a Nuclear-style queue bar. Queue is the default body; the header holds chat and notification toggles (press again to return to the queue), clear-queue and a "more" menu (save as playlist, save locally on desktop, randomize order). Collapsed it shows queue artwork plus chat/notification buttons. Missing states: queue item loading/error rows (covered in QueuePanel stories), channel-designer rail override.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/')],
  args: { isCollapsed: false },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Queue: Story = {
  decorators: [withRailState({ notifications: NOTIFICATIONS })],
};

export const EmptyQueue: Story = {
  name: 'Queue empty',
  decorators: [withRailState({ queue: [] })],
};

export const LongQueue: Story = {
  name: 'Long queue',
  decorators: [
    withRailState({ queue: LONG_QUEUE, currentId: 'archive:long-5' }),
  ],
};

export const Collapsed: Story = {
  decorators: [withRailState({ notifications: NOTIFICATIONS })],
  args: { isCollapsed: true },
};

export const CollapsedEmpty: Story = {
  name: 'Collapsed, queue empty',
  decorators: [withRailState({ queue: [] })],
  args: { isCollapsed: true },
};

export const Notifications: Story = {
  decorators: [
    withRailState({ tab: 'notifications', notifications: NOTIFICATIONS }),
  ],
};

export const NotificationsEmpty: Story = {
  name: 'Notifications, all caught up',
  decorators: [withRailState({ tab: 'notifications' })],
};

export const ChatUnavailable: Story = {
  name: 'Chat unavailable',
  decorators: [
    withRailState({
      tab: 'chat',
      chatDisabledReason: 'Open a channel with chat enabled.',
    }),
  ],
};

/** Chat history/access fetch through the mocked API layer; there's no
 * Centrifugo server in Storybook, so the socket fails and the panel falls
 * back to local-echo ("mock") mode - see ChannelChatPanel.stories.tsx. */
export const ChatOpen: Story = {
  decorators: [
    withMockAuth(),
    withRailState({
      tab: 'chat',
      chatSlug: 'northern-lights',
      chatEnabled: true,
    }),
  ],
};
