import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedPlayerBar } from '@tahti-web/components/ConnectedPlayerBar';
import { useLayoutStore } from '@tahti-web/stores/layoutStore';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { expect, userEvent, within } from 'storybook/test';

import type { QueueItem } from '@tahti-player/model';

import { withTahtiRouter } from './_lib/decorators';

function mockQueueItem(
  id: string,
  title: string,
  artist: string,
  durationMs?: number,
): QueueItem {
  return {
    id,
    track: {
      title,
      artists: [{ name: artist, roles: ['performer'] }],
      durationMs,
      source: { provider: 'tahti', id },
      streamCandidates: [
        {
          id: `${id}:stream`,
          title,
          failed: false,
          source: { provider: 'tahti', id },
          stream: {
            url: `https://stream.tahti.live/${id}/live.m3u8`,
            protocol: 'hls',
            source: { provider: 'tahti', id },
          },
          lastResolvedAtIso: new Date().toISOString(),
        },
      ],
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

const mockQueue: QueueItem[] = [
  mockQueueItem('archive:1', 'Midnight Drift', 'Northern Lights', 245000),
  mockQueueItem('archive:2', 'Static Bloom', 'Halcyon Field', 198000),
  mockQueueItem('archive:3', 'Low Tide', 'Northern Lights', 312000),
];

/** Seeds the player + layout stores directly (bypassing AudioEngine/play())
 * so the bar renders a realistic "now playing" state without a real
 * media element or network stream. */
function withSeededPlayerBar(opts: {
  isLive?: boolean;
  status?: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  bottomQueueOpen?: boolean;
  currentTime?: number;
  duration?: number;
  queue?: QueueItem[];
  currentId?: string | null;
}): Decorator {
  return (Story) => {
    usePlayerStore.setState({
      queue: opts.queue ?? mockQueue,
      currentId:
        opts.currentId !== undefined
          ? opts.currentId
          : ((opts.queue ?? mockQueue)[0]?.id ?? null),
      status: opts.status ?? 'playing',
      isLive: opts.isLive ?? false,
      currentTime: opts.currentTime ?? 62,
      duration: opts.duration ?? 245,
      volume: 0.7,
      muted: false,
      shuffle: false,
      repeatMode: 'off',
      playerBarVisible: true,
    });
    useLayoutStore.setState({ bottomQueueOpen: opts.bottomQueueOpen ?? false });
    return <Story />;
  };
}

const meta: Meta<typeof ConnectedPlayerBar> = {
  title: 'Tahti/Player/ConnectedPlayerBar',
  component: ConnectedPlayerBar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PlayingArchive: Story = {
  decorators: [withSeededPlayerBar({})],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Midnight Drift')[0]).toBeVisible();

    await userEvent.click(canvas.getByTestId('player-pause-button'));
    await expect(usePlayerStore.getState().status).toBe('paused');
    await userEvent.click(await canvas.findByTestId('player-play-button'));
    await expect(usePlayerStore.getState().status).toBe('playing');

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(usePlayerStore.getState().currentId).toBe('archive:2');
    await expect(await canvas.findAllByText('Static Bloom')).not.toHaveLength(
      0,
    );
  },
};

/** Shuffle and repeat cycle through the store (off -> all -> one -> off). */
export const ShuffleAndRepeat: Story = {
  decorators: [withSeededPlayerBar({})],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Shuffle/ }));
    await expect(usePlayerStore.getState().shuffle).toBe(true);
    for (const mode of ['all', 'one', 'off'] as const) {
      await userEvent.click(canvas.getByRole('button', { name: /^Repeat/ }));
      await expect(usePlayerStore.getState().repeatMode).toBe(mode);
    }
  },
};

export const LiveChannel: Story = {
  decorators: [
    withSeededPlayerBar({
      isLive: true,
      queue: [
        mockQueueItem(
          'radio:northern-lights',
          'Northern Lights — Live',
          'Northern Lights',
        ),
      ],
      currentId: 'radio:northern-lights',
    }),
  ],
};

export const QueueExpanded: Story = {
  name: 'Queue strip expanded',
  decorators: [withSeededPlayerBar({ bottomQueueOpen: true })],
  // The bottom queue strip is the phone layout; desktop uses the right rail.
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Hide queue' }));
    await expect(useLayoutStore.getState().bottomQueueOpen).toBe(false);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Show queue, 3 in queue' }),
    );
    await expect(useLayoutStore.getState().bottomQueueOpen).toBe(true);
  },
};

export const Loading: Story = {
  decorators: [withSeededPlayerBar({ status: 'loading' })],
};

export const Empty: Story = {
  name: 'Nothing playing (bar hidden — see note)',
  render: () => (
    <div className="text-foreground-secondary p-6 text-sm">
      ConnectedPlayerBar returns <code>null</code> whenever{' '}
      <code>playerBarVisible</code> is false (its default, and the state after
      "hide player" is clicked) — there is no empty visual state to show here
      beyond blank space.
    </div>
  ),
};
