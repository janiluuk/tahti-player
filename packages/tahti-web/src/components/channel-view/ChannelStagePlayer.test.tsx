import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicChannel, TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { HearthisEmbedHostProvider } from '../HearthisEmbedHost';
import { ChannelStagePlayer } from './ChannelStagePlayer';

vi.mock('../EmbedSurface', () => ({
  EmbedSurface: ({
    provider,
    compact,
    autoplay,
  }: {
    provider: string;
    compact?: boolean;
    autoplay: boolean;
  }) => (
    <div
      data-testid="embed-surface"
      data-compact={compact ? 'true' : undefined}
      data-autoplay={String(autoplay)}
    >
      {provider}
    </div>
  ),
}));

const channel = {
  slug: 'night-drive',
  state: 'OFFLINE',
  hlsUrl: null,
  nowPlaying: null,
  user: { displayName: 'Night Drive', username: 'nightdrive' },
} as unknown as PublicChannel;

async function renderStage(
  props: Partial<Parameters<typeof ChannelStagePlayer>[0]> = {},
) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <HearthisEmbedHostProvider>
          <ChannelStagePlayer
            channel={channel}
            slug="night-drive"
            live={false}
            subtle={false}
            chatOn
            follow={null}
            signedIn={false}
            {...props}
          />
        </HearthisEmbedHostProvider>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('ChannelStagePlayer', () => {
  afterEach(() => {
    usePlayerStore.setState({ queue: [], currentId: null });
  });

  it('shows the air status inside the stage', async () => {
    await renderStage();
    expect(screen.getByTestId('channel-air-badge')).toHaveTextContent(
      'Offline',
    );
  });

  it('hosts the widget of an embed track from this channel', async () => {
    usePlayerStore.setState({
      currentId: 'sound:mix-1',
      queue: [
        {
          id: 'sound:mix-1',
          track: {
            title: 'Night mix',
            artists: [{ name: 'Night Drive' }],
            source: { provider: 'hearthis', id: 'https://hearthis.at/x/1/' },
          },
        },
      ] as never,
    });
    await renderStage({ trackIds: new Set(['sound:mix-1']) });

    expect(screen.getByTestId('channel-stage-embed')).toHaveTextContent(
      'Night mix',
    );
    const slot = screen.getByTestId('channel-stage-embed-frame');
    expect(slot.querySelector('[data-testid="embed-surface"]')).toBeNull();
    expect(screen.getByTestId('playing-embed-holder')).toContainElement(
      screen.getByTestId('embed-surface'),
    );
    expect(screen.getByTestId('embed-surface')).toHaveTextContent('hearthis');
    expect(screen.getByTestId('channel-air-badge')).toBeInTheDocument();
  });

  it('leaves an embed from another channel to the player bar', async () => {
    usePlayerStore.setState({
      currentId: 'sound:other',
      queue: [
        {
          id: 'sound:other',
          track: {
            title: 'Other mix',
            artists: [{ name: 'Someone' }],
            source: { provider: 'hearthis', id: 'https://hearthis.at/y/2/' },
          },
        },
      ] as never,
    });
    await renderStage({ trackIds: new Set(['sound:mix-1']) });
    expect(screen.queryByTestId('channel-stage-embed')).toBeNull();
  });

  describe('on air', () => {
    const rotation = {
      ...channel,
      state: 'LIVE',
      hlsUrl: 'https://cdn.example/live.m3u8',
      signalConnected: false,
      nowPlaying: {
        title: 'Night mix',
        artistName: 'Night Drive',
        artistUsername: 'nightdrive',
        artworkUrl: null,
      },
    } as unknown as PublicChannel;
    const track = (overrides: Partial<TahtiPlayable>) =>
      ({
        id: 'sound:mix-1',
        kind: 'sound',
        title: 'Night mix',
        artist: 'Night Drive',
        streamUrl: '',
        protocol: 'https',
        ...overrides,
      }) as TahtiPlayable;

    it('puts the play button first, left of the now-playing title', async () => {
      await renderStage({ channel: rotation, live: true });
      const play = screen.getByRole('button', { name: 'Play stream' });
      const title = screen.getAllByText('Night mix')[0]!;
      expect(
        play.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('falls back to the channel avatar for a track with no cover and wraps the title', async () => {
      await renderStage({
        channel: {
          ...rotation,
          user: {
            ...rotation.user,
            avatarUrl: 'https://cdn.example/night-drive.jpg',
          },
        } as PublicChannel,
        live: true,
      });
      const covers = Array.from(document.querySelectorAll('img')).map((img) =>
        img.getAttribute('src'),
      );
      expect(covers).toContain('https://cdn.example/night-drive.jpg');
      const title = screen
        .getAllByText('Night mix')
        .find((el) => el.className.includes('font-extrabold'))!;
      expect(title.className).toContain('line-clamp-2');
      expect(title.className).not.toContain('truncate');
    });

    it('draws the real waveform when the track has peaks', async () => {
      await renderStage({
        channel: rotation,
        live: true,
        playables: [track({ peaks: [10, 200, 80, 40] })],
      });
      expect(
        document.querySelector('[data-waveform="peaks"]'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('embed-surface')).toBeNull();
    });

    it('shows the compact embed widget instead of an empty waveform', async () => {
      await renderStage({
        channel: rotation,
        live: true,
        playables: [
          track({
            embed: {
              provider: 'hearthis',
              embedUri: 'https://hearthis.at/x/1/',
            },
          }),
        ],
      });
      expect(document.querySelector('[data-waveform]')).toBeNull();
      const widget = screen.getByTestId('embed-surface');
      expect(widget).toHaveAttribute('data-compact', 'true');
      expect(widget).toHaveAttribute('data-autoplay', 'false');
    });

    it('leaves out the waveform when there is nothing real to draw', async () => {
      await renderStage({ channel: rotation, live: true, playables: [] });
      expect(document.querySelector('[data-waveform]')).toBeNull();
      expect(screen.queryByTestId('embed-surface')).toBeNull();
    });

    it('never mounts a second widget for the embed the player is already playing', async () => {
      usePlayerStore.setState({
        currentId: 'sound:elsewhere',
        queue: [
          {
            id: 'sound:elsewhere',
            track: {
              title: 'Night mix',
              artists: [{ name: 'Night Drive' }],
              source: { provider: 'hearthis', id: 'https://hearthis.at/x/1/' },
            },
          },
        ] as never,
      });
      await renderStage({
        channel: rotation,
        live: true,
        playables: [
          track({
            embed: {
              provider: 'hearthis',
              embedUri: 'https://hearthis.at/x/1/',
            },
          }),
        ],
      });
      expect(screen.queryByTestId('channel-stage-embed-widget')).toBeNull();
      expect(screen.getAllByTestId('embed-surface')).toHaveLength(1);
      expect(screen.getByTestId('playing-embed-holder')).toContainElement(
        screen.getByTestId('embed-surface'),
      );
    });
  });
});
