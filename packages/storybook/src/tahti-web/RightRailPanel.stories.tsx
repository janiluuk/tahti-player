import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { RightRailHeaderActions } from '@tahti-web/components/RightRailHeaderActions';
import { RightRailPanel } from '@tahti-web/components/RightRailPanel';
import { usePlayerStore } from '@tahti-web/stores/playerStore';

import type { QueueItem } from '@tahti-player/model';
import { PlayerWorkspace } from '@tahti-player/ui';

import { withTahtiRouter } from './_lib/decorators';

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

type Seed = {
  queue?: QueueItem[];
  currentId?: string | null;
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
          'tahti-web right rail as a Nuclear-style queue bar: the queue only. The header holds clear-queue and a "more" menu (save as playlist, save locally on desktop, randomize order). Collapsed it shows queue artwork. Chat and notifications are top-bar controls, never rail views (docs/DECISIONS.md, 2026-09-28). Missing states: queue item loading/error rows (covered in QueuePanel stories), channel-designer rail override.',
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
  decorators: [withRailState()],
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
  decorators: [withRailState()],
  args: { isCollapsed: true },
};

export const CollapsedEmpty: Story = {
  name: 'Collapsed, queue empty',
  decorators: [withRailState({ queue: [] })],
  args: { isCollapsed: true },
};
