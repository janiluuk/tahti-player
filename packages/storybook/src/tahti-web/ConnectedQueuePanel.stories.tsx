import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedQueuePanel } from '@tahti-web/components/ConnectedQueuePanel';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import type { QueueItem } from '@tahti-player/model';

function mockQueueItem(
  id: string,
  title: string,
  artist: string,
  durationMs?: number,
  status: QueueItem['status'] = 'idle',
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
    status,
    addedAtIso: new Date().toISOString(),
  };
}

const mockQueue: QueueItem[] = [
  mockQueueItem('archive:1', 'Midnight Drift', 'Northern Lights', 245000),
  mockQueueItem(
    'archive:2',
    'Static Bloom',
    'Halcyon Field',
    198000,
    'loading',
  ),
  mockQueueItem('archive:3', 'Low Tide', 'Northern Lights', 312000),
  mockQueueItem('archive:4', 'Glass Hours', 'Halcyon Field', 221000),
];

function withSeededQueue(
  queue: QueueItem[] = mockQueue,
  currentId: string | null = mockQueue[0]?.id ?? null,
): Decorator {
  return (Story) => {
    usePlayerStore.setState({ queue, currentId });
    return <Story />;
  };
}

/** The clickable queue row (role=button) that holds `title`. */
function queueRow(canvas: ReturnType<typeof within>, title: string) {
  const label: HTMLElement = canvas.getByText(title);
  const row = label.closest<HTMLElement>('[role="button"]');
  if (!row) {
    throw new Error(`No queue row for ${title}`);
  }
  return row;
}

const meta: Meta<typeof ConnectedQueuePanel> = {
  title: 'Tahti/Player/ConnectedQueuePanel',
  component: ConnectedQueuePanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withSeededQueue()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { isCollapsed: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lowTide = queueRow(canvas, 'Low Tide');
    await userEvent.click(lowTide);
    await expect(usePlayerStore.getState().currentId).toBe('archive:3');

    const glassHours = queueRow(canvas, 'Glass Hours');
    await userEvent.hover(glassHours);
    await userEvent.click(
      within(glassHours).getByRole('button', { name: 'Remove' }),
    );
    await expect(
      usePlayerStore.getState().queue.map((item) => item.id),
    ).toEqual(['archive:1', 'archive:2', 'archive:3']);
    await waitFor(() => expect(canvas.queryByText('Glass Hours')).toBeNull());
  },
};

export const Collapsed: Story = {
  args: { isCollapsed: true },
};

export const EmptyQueue: Story = {
  decorators: [withSeededQueue([], null)],
  args: { isCollapsed: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Queue empty')).toBeVisible();
    await expect(
      canvas.getByText('Play a channel or radio to start listening'),
    ).toBeVisible();
  },
};
