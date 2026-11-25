import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedPlayerBar } from '@tahti-web/components/ConnectedPlayerBar';
import { HearthisEmbedHostProvider } from '@tahti-web/components/HearthisEmbedHost';
import {
  PHONE_PLAYER_MINIMIZED_KEY,
  resetPhonePlayerMinimizedCache,
} from '@tahti-web/hooks/usePhonePlayerMinimized';
import { useLayoutStore } from '@tahti-web/stores/layoutStore';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import type { QueueItem } from '@tahti-player/model';

import { stubReducedMotion } from '../_lib/motion';
import { withTahtiRouter } from './_lib/decorators';
import { stubPhoneViewport } from './_lib/phone';

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
    await expect(canvas.queryByTestId('hearthis-player-embed')).toBeNull();

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

/** Clicking the seek bar seeks to that point; the volume slider and mute
 * button drive the store. */
export const SeekAndVolume: Story = {
  decorators: [withSeededPlayerBar({})],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const seek = canvas.getByRole('slider', { name: /^Seek/ });
    await expect(seek).toHaveAttribute('aria-valuenow', '25');
    const rect = seek.getBoundingClientRect();
    const midpoint = { clientX: rect.left + rect.width * 0.5, pointerId: 1 };
    fireEvent.pointerDown(seek, midpoint);
    fireEvent.pointerUp(seek, midpoint);
    await expect(usePlayerStore.getState().currentTime).toBeCloseTo(122.5, 0);
    await waitFor(() => expect(seek).toHaveAttribute('aria-valuenow', '50'));

    const volume = within(canvas.getByTestId('player-volume-slider')).getByRole(
      'slider',
      { name: 'Volume' },
    );
    await expect(volume).toHaveValue('70');
    fireEvent.change(volume, { target: { value: '30' } });
    await expect(usePlayerStore.getState().volume).toBeCloseTo(0.3);

    await userEvent.click(canvas.getByRole('button', { name: 'Mute' }));
    await expect(usePlayerStore.getState().muted).toBe(true);
    await expect(volume).toHaveValue('0');
    await userEvent.click(canvas.getByRole('button', { name: 'Unmute' }));
    await expect(usePlayerStore.getState().muted).toBe(false);
    await expect(volume).toHaveValue('30');
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
    const icon = canvas
      .getByRole('button', { name: 'Hide queue' })
      .querySelector('svg')!
      .getBoundingClientRect();
    const badge = canvas
      .getByTestId('queue-count-badge')
      .getBoundingClientRect();
    await expect(badge.left >= icon.right || badge.bottom <= icon.top).toBe(
      true,
    );
  },
};

export const Loading: Story = {
  decorators: [withSeededPlayerBar({ status: 'loading' })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spinner = canvas.getByTestId('player-loading-spinner');
    await expect(spinner.closest('button')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  },
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

const embedQueueItem: QueueItem = {
  id: 'sound:embed-1',
  track: {
    title: "Don't Turn Away From Love LP - 04",
    artists: [{ name: 'Yaniho', roles: ['performer'] }],
    durationMs: 288000,
    source: { provider: 'hearthis', id: 'yaniho/dont-turn-away-04' },
    streamCandidates: [],
    artwork: {
      items: [
        { url: 'https://picsum.photos/seed/embed-1/128', purpose: 'cover' },
      ],
    },
  },
  status: 'idle',
  addedAtIso: new Date().toISOString(),
};

/** An embed-only track replaces the player. The bar reserves a slot; the
 * dock paints the one provider widget over it. Skip and the queue stay
 * because the widget has neither. */
export const EmbedTrack: Story = {
  decorators: [
    (Story) => (
      <HearthisEmbedHostProvider>
        <Story />
      </HearthisEmbedHostProvider>
    ),
    withSeededPlayerBar({
      queue: [embedQueueItem, ...mockQueue],
      currentId: 'sound:embed-1',
      status: 'paused',
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const host = canvas.getByTestId('player-embed-host');
    const slot = within(host).getByTestId('hearthis-player-embed');
    await expect(slot.querySelector('iframe')).toBeNull();
    const frame = canvas
      .getByTestId('playing-embed-holder')
      .querySelector('iframe');
    await expect(frame).not.toBeNull();
    await expect(canvas.queryByTestId('player-play-button')).toBeNull();
    await expect(canvas.queryByTestId('player-pause-button')).toBeNull();
    await expect(canvas.queryByTestId('now-playing-title')).toBeNull();
    await expect(canvas.queryByTestId('player-embed-note')).toBeNull();
    await expect(canvas.getByTestId('player-next-button')).toBeVisible();
    await expect(canvas.queryByRole('slider', { name: /^Seek/ })).toBeNull();
  },
};

/** Phone bar while paused: minimize and a quiet close share one ⋯ menu so
 * the title keeps its room, and the queue stays. While playing the bar shows
 * minimize directly and has no close. */
export const PhoneCloseWhenPaused: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [withSeededPlayerBar({ status: 'paused' })],
  beforeEach: () => {
    const undoPhone = stubPhoneViewport();
    const undoMinimized = forgetPhoneMinimized(false)();
    return () => {
      undoMinimized();
      undoPhone();
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await expect(await canvas.findByTestId('mobile-player-bar')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Minimize player' }),
    ).toBeNull();
    const more = canvas.getByTestId('mobile-player-more');
    const box = more.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(44);
    await expect(box.height).toBeGreaterThanOrEqual(44);

    await userEvent.click(canvas.getByTestId('player-play-button'));
    await expect(canvas.queryByTestId('mobile-player-more')).toBeNull();
    await expect(
      canvas.getByRole('button', { name: 'Minimize player' }),
    ).toBeVisible();
    await userEvent.click(await canvas.findByTestId('player-pause-button'));

    await userEvent.click(await canvas.findByTestId('mobile-player-more'));
    await userEvent.click(
      await page.findByRole('button', { name: 'Close player' }),
    );
    await waitFor(() =>
      expect(canvas.queryByTestId('mobile-player-bar')).toBeNull(),
    );
    await expect(usePlayerStore.getState().queue).toHaveLength(3);

    usePlayerStore.getState().setStatus('playing');
    await expect(await canvas.findByTestId('mobile-player-bar')).toBeVisible();
  },
};

/** Paused at 360 and 390 px: play, queue and ⋯ leave the title most of the
 * row. */
function phoneTitleRoomStory(width: 360 | 390): Story {
  return {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    decorators: [
      (Story) => (
        <div style={{ width }}>
          <Story />
        </div>
      ),
      withSeededPlayerBar({ status: 'paused' }),
    ],
    beforeEach: () => {
      const undoPhone = stubPhoneViewport();
      const undoMinimized = forgetPhoneMinimized(false)();
      return () => {
        undoMinimized();
        undoPhone();
      };
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const bar = await canvas.findByTestId('mobile-player-bar');
      const title = canvas.getByTestId('mobile-player-title');
      await expect(bar.getBoundingClientRect().width).toBe(width);
      await expect(title.getBoundingClientRect().width).toBeGreaterThanOrEqual(
        width === 360 ? 90 : 120,
      );
      await expect(
        canvas.queryByRole('button', { name: 'Close player' }),
      ).toBeNull();
      await expect(canvas.getByTestId('mobile-player-more')).toBeVisible();
    },
  };
}

export const PhonePausedTitleRoom360 = phoneTitleRoomStory(360);
export const PhonePausedTitleRoom390 = phoneTitleRoomStory(390);

const longTitleQueue: QueueItem[] = [
  mockQueueItem(
    'archive:long',
    'Aamuyön valot (pitkä versio, livenä Tavastialla syksyllä 2025)',
    'Northern Lights, Halcyon Field ja muut ystävät',
    412000,
  ),
  ...mockQueue,
];

function forgetPhoneMinimized(minimized: boolean) {
  return () => {
    try {
      if (minimized) {
        localStorage.setItem(PHONE_PLAYER_MINIMIZED_KEY, '1');
      } else {
        localStorage.removeItem(PHONE_PLAYER_MINIMIZED_KEY);
      }
    } catch {
      // Stories still render when the browser blocks storage.
    }
    resetPhonePlayerMinimizedCache();
    return () => {
      try {
        localStorage.removeItem(PHONE_PLAYER_MINIMIZED_KEY);
      } catch {
        // See above.
      }
      resetPhonePlayerMinimizedCache();
    };
  };
}

/** A title too long for the bar scrolls; the full title is announced once. */
export const LongTitleScrolls: Story = {
  decorators: [withSeededPlayerBar({ queue: longTitleQueue })],
  beforeEach: stubReducedMotion(false),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByTestId('now-playing-title');
    const marquee = title.querySelector<HTMLElement>('.tahti-marquee')!;
    await waitFor(() =>
      expect(marquee).toHaveAttribute('data-marquee', 'scrolling'),
    );
    await expect(title).toHaveAccessibleName(longTitleQueue[0]!.track.title);
  },
};

/** Same title under reduced motion: static, truncated. */
export const LongTitleReducedMotion: Story = {
  decorators: [withSeededPlayerBar({ queue: longTitleQueue })],
  beforeEach: stubReducedMotion(true),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const marquee = canvas
      .getByTestId('now-playing-title')
      .querySelector<HTMLElement>('.tahti-marquee')!;
    await waitFor(() =>
      expect(marquee).toHaveAttribute('data-marquee', 'static'),
    );
    await expect(marquee.querySelector('.tahti-marquee-track')).toBeNull();
  },
};

/** Phone bar with a long title: the title line scrolls inside the bar. */
export const PhoneLongTitleScrolls: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="max-w-[390px]">
        <Story />
      </div>
    ),
    withSeededPlayerBar({ queue: longTitleQueue }),
  ],
  beforeEach: () => {
    const undoPhone = stubPhoneViewport();
    const undoMotion = stubReducedMotion(false)();
    const undoMinimized = forgetPhoneMinimized(false)();
    return () => {
      undoMinimized();
      undoMotion();
      undoPhone();
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByTestId('mobile-player-title');
    await waitFor(() =>
      expect(title).toHaveAttribute('data-marquee', 'scrolling'),
    );
    await expect(
      canvas.getByRole('button', {
        name: `Open full-screen player: ${longTitleQueue[0]!.track.title}`,
      }),
    ).toBeVisible();
  },
};

/** Phone bar minimized to a thin strip and restored, the choice kept in
 * localStorage. */
export const PhoneMinimizeAndRestore: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="max-w-[390px]">
        <Story />
      </div>
    ),
    withSeededPlayerBar({}),
  ],
  beforeEach: () => {
    const undoPhone = stubPhoneViewport();
    const undoMinimized = forgetPhoneMinimized(false)();
    return () => {
      undoMinimized();
      undoPhone();
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = await canvas.findByTestId('mobile-player-bar');
    const fullHeight = bar.getBoundingClientRect().height;

    await userEvent.click(
      canvas.getByRole('button', { name: 'Minimize player' }),
    );
    const mini = await canvas.findByTestId('mobile-player-bar');
    await expect(mini).toHaveAttribute('data-minimized');
    await expect(mini.getBoundingClientRect().height).toBeLessThan(
      fullHeight / 1.5,
    );
    await expect(localStorage.getItem(PHONE_PLAYER_MINIMIZED_KEY)).toBe('1');

    await userEvent.click(canvas.getByTestId('player-pause-button'));
    await expect(usePlayerStore.getState().status).toBe('paused');

    await userEvent.click(
      canvas.getByRole('button', { name: 'Show full player: Midnight Drift' }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId('mobile-player-bar')).not.toHaveAttribute(
        'data-minimized',
      ),
    );
    await expect(localStorage.getItem(PHONE_PLAYER_MINIMIZED_KEY)).toBeNull();
  },
};

/** A phone that minimized the bar earlier opens with the strip. */
export const PhoneMinimized: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="max-w-[390px]">
        <Story />
      </div>
    ),
    withSeededPlayerBar({ queue: longTitleQueue }),
  ],
  beforeEach: () => {
    const undoPhone = stubPhoneViewport();
    const undoMinimized = forgetPhoneMinimized(true)();
    return () => {
      undoMinimized();
      undoPhone();
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId('mobile-player-bar'),
    ).toHaveAttribute('data-minimized');
    await expect(
      canvas.queryByRole('button', { name: 'Minimize player' }),
    ).toBeNull();
    const fill = canvas.getByTestId('mini-player-progress-fill');
    const track = canvas.getByTestId('mini-player-progress');
    await expect(track.getBoundingClientRect().height).toBeGreaterThan(0);
    const scale = () =>
      Number(/scaleX\(([\d.]+)\)/.exec(fill.style.transform)?.[1]);
    await expect(scale()).toBeCloseTo(62 / 245, 3);
    usePlayerStore.getState().setProgress(122.5, 245);
    await expect(scale()).toBeCloseTo(0.5, 3);
    await userEvent.click(canvas.getByTestId('expand-mobile-player-bar'));
    await expect(
      await canvas.findByRole('button', { name: 'Minimize player' }),
    ).toBeVisible();
  },
};
