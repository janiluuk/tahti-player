import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicChannel } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { ChannelStagePlayer } from './ChannelStagePlayer';

vi.mock('../EmbedSurface', () => ({
  EmbedSurface: ({ provider }: { provider: string }) => (
    <div data-testid="embed-surface">{provider}</div>
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
});
