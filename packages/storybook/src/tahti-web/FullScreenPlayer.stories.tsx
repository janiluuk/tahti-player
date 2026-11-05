import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { FullScreenPlayer } from '@tahti-web/components/FullScreenPlayer';
import { useLayoutStore } from '@tahti-web/stores/layoutStore';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { useEffect } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import type { QueueItem } from '@tahti-player/model';

import { withinBody } from './_lib/play';

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
      // Without a stream candidate playableFromQueueItem() returns null and
      // the player shows "Nothing playing" instead of this track.
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
          { url: `https://picsum.photos/seed/${id}/512`, purpose: 'cover' },
        ],
      },
    },
    status: 'idle',
    addedAtIso: new Date().toISOString(),
  };
}

function withSeededFullScreenPlayer(opts: {
  isLive?: boolean;
  queue?: QueueItem[];
}): Decorator {
  return (Story) => {
    const queue = opts.queue ?? [
      mockQueueItem('archive:1', 'Midnight Drift', 'Northern Lights', 245000),
    ];
    usePlayerStore.setState({
      queue,
      currentId: queue[0]?.id ?? null,
      status: 'playing',
      isLive: opts.isLive ?? false,
      currentTime: 92,
      duration: 245,
      volume: 0.7,
      muted: false,
      shuffle: false,
      repeatMode: 'off',
    });
    useLayoutStore.setState({ fullScreenPlayerOpen: true });
    return <Story />;
  };
}

const meta: Meta<typeof FullScreenPlayer> = {
  title: 'Tahti/Player/FullScreenPlayer',
  component: FullScreenPlayer,
  parameters: { layout: 'fullscreen' },
  decorators: [withSeededFullScreenPlayer({})],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ArchiveTrack: Story = {
  play: async ({ canvasElement }) => {
    const body = withinBody(canvasElement);
    const player = within(
      await body.findByRole('dialog', { name: 'Now playing, full screen' }),
    );
    const heading = player.getByRole('heading', { name: 'Midnight Drift' });
    // The overlay fades in, so wait out the entrance animation.
    await waitFor(() => expect(heading).toBeVisible());
    await userEvent.click(player.getByTestId('player-pause-button'));
    await expect(usePlayerStore.getState().status).toBe('paused');
    await userEvent.click(
      player.getByRole('button', { name: 'Minimize player' }),
    );
    await expect(useLayoutStore.getState().fullScreenPlayerOpen).toBe(false);
  },
};

export const LiveChannel: Story = {
  decorators: [
    withSeededFullScreenPlayer({
      isLive: true,
      queue: [
        mockQueueItem(
          'radio:northern-lights',
          'Northern Lights — Live',
          'Northern Lights',
        ),
      ],
    }),
  ],
};

/** Browser fullscreen = driving mode: large transport, edge prev/next,
 * swipe between tracks, secondary chrome hidden. */
export const DrivingMode: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    withSeededFullScreenPlayer({
      queue: [
        mockQueueItem('archive:1', 'Midnight Drift', 'Northern Lights', 245000),
        mockQueueItem('archive:2', 'Polar Static', 'Northern Lights', 312000),
        mockQueueItem('archive:3', 'After Hours', 'DJ Moonlight', 198000),
      ],
    }),
    (Story) => {
      useEffect(() => {
        const descriptor = Object.getOwnPropertyDescriptor(
          Document.prototype,
          'fullscreenElement',
        );
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          get: () => document.documentElement,
        });
        document.dispatchEvent(new Event('fullscreenchange'));
        return () => {
          if (descriptor) {
            Object.defineProperty(
              Document.prototype,
              'fullscreenElement',
              descriptor,
            );
          } else {
            delete (document as { fullscreenElement?: Element })
              .fullscreenElement;
          }
          document.dispatchEvent(new Event('fullscreenchange'));
        };
      }, []);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const body = withinBody(canvasElement);
    const player = within(
      await body.findByRole('dialog', {
        name: 'Now playing, driving mode',
      }),
    );
    await waitFor(() =>
      expect(
        player.getByRole('heading', { name: 'Midnight Drift' }),
      ).toBeVisible(),
    );
    await expect(player.getByTestId('driving-prev')).toBeInTheDocument();
    await expect(player.getByTestId('driving-next')).toBeInTheDocument();
    await expect(
      player.queryByTestId('player-shuffle-button'),
    ).not.toBeInTheDocument();
  },
};
