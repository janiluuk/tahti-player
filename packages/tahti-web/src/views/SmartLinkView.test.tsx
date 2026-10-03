// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import * as clicks from '../api/smart-link-clicks';
import { usePlayerStore } from '../stores/playerStore';
import { SmartLinkView } from './SmartLinkView';

async function renderSmartLink(release: Record<string, unknown>) {
  vi.spyOn(client, 'fetchSmartLink').mockResolvedValue({
    data: {
      release: {
        id: 'r1',
        title: 'Night Drive',
        smartLinkSlug: 'night-drive',
        artworkUrl: null,
        ...release,
      },
      artist: { username: 'tahti', displayName: 'Tahti', avatarUrl: null },
      targets: {},
      featuredCollections: [],
      releaseUrl: '/r/night-drive',
    } as never,
    meta: { source: 'api' },
  });
  const profile = vi.spyOn(client, 'fetchProfile');
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <SmartLinkView slug="night-drive" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/r/night-drive'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return { profile };
}

describe('SmartLinkView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the "Powered by Tahti" footer linking home when turned on', async () => {
    await renderSmartLink({ showPoweredByFooter: true });
    const link = screen.getByRole('link', { name: 'Powered by Tahti' });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('falls back to the Tahti release link when there are no services', async () => {
    await renderSmartLink({});
    const link = within(
      screen.getByRole('region', { name: 'Listen on' }),
    ).getByRole('link', { name: 'Tahti' });
    expect(link.getAttribute('href')).toBe('/r/night-drive');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('lists the release genre between its year and type', async () => {
    await renderSmartLink({
      releaseDate: '2026-03-01T00:00:00.000Z',
      genre: 'House',
      type: 'EP',
    });
    expect(screen.getByText('2026 · House · EP')).toBeTruthy();
  });

  it('leaves the genre out when the smart link has none', async () => {
    await renderSmartLink({
      releaseDate: '2026-03-01T00:00:00.000Z',
      genre: null,
      type: 'EP',
    });
    expect(screen.getByText('2026 · EP')).toBeTruthy();
  });

  it('hides the footer when it is off or missing', async () => {
    await renderSmartLink({ showPoweredByFooter: false });
    expect(screen.queryByText('Powered by Tahti')).toBeNull();
    cleanup();
    vi.restoreAllMocks();
    await renderSmartLink({});
    expect(screen.queryByText('Powered by Tahti')).toBeNull();
  });

  it('records a click through to a streaming service', async () => {
    vi.spyOn(client, 'fetchSmartLink').mockResolvedValue({
      data: {
        release: {
          id: 'r1',
          title: 'Night Drive',
          smartLinkSlug: 'night-drive',
          artworkUrl: null,
        },
        artist: { username: 'tahti', displayName: 'Tahti', avatarUrl: null },
        targets: { spotify: 'https://open.spotify.com/album/x', tidal: '' },
        featuredCollections: [],
        releaseUrl: '/r/night-drive',
      } as never,
      meta: { source: 'api' },
    });
    const record = vi
      .spyOn(clicks, 'recordSmartLinkClick')
      .mockImplementation(() => {});
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <SmartLinkView slug="night-drive" />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const link = screen.getByRole('link', { name: /Spotify/ });
    expect(link.getAttribute('target')).toBe('_blank');
    fireEvent.click(link);
    expect(record).toHaveBeenCalledWith('night-drive', 'spotify');
    expect(screen.queryByRole('link', { name: /Tidal/ })).toBeNull();
  });

  it('plays the release tracks from the smart link without loading the profile', async () => {
    const play = vi.fn();
    usePlayerStore.setState({ play } as never);
    const { profile } = await renderSmartLink({
      artworkUrl: 'https://cdn/art.jpg',
      tracks: [
        {
          id: 't1',
          soundId: 's1',
          title: 'Opening',
          position: 1,
          durationSec: 200,
          audioUrl: 'https://cdn/t1.opus',
          gate: null,
        },
        {
          id: 't2',
          soundId: null,
          title: 'Closing',
          position: 2,
          audioUrl: 'https://cdn/t2.m3u8',
        },
      ],
    });
    expect(profile).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByTestId('release-social-header')).getByRole('button', {
        name: /Play all/,
      }),
    );
    expect(play).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sound:s1',
        streamUrl: 'https://cdn/t1.opus',
        protocol: 'https',
        coverUrl: 'https://cdn/art.jpg',
      }),
      {
        enqueueRest: [
          expect.objectContaining({
            id: 'sound:t2',
            streamUrl: 'https://cdn/t2.m3u8',
            protocol: 'hls',
          }),
        ],
      },
    );
  });

  it('shows a locked state for gated tracks instead of a play button', async () => {
    await renderSmartLink({
      tracks: [
        {
          id: 't1',
          soundId: 's1',
          title: 'Members Mix',
          position: 1,
          audioUrl: null,
          gate: { reason: 'SUBSCRIBERS_ONLY' },
        },
      ],
    });
    expect(screen.queryByRole('button', { name: /Play all/ })).toBeNull();
    const locked = screen.getByRole('region', { name: 'Locked tracks' });
    expect(within(locked).getByText('Fan subscribers only')).toBeTruthy();
    expect(
      within(locked)
        .getByRole('link', { name: 'Members Mix' })
        .getAttribute('href'),
    ).toBe('/t/s1');
  });

  it('lists track credits, rights lines and catalogue links', async () => {
    await renderSmartLink({
      pLine: '℗ 2026 Night Records',
      cLine: '2026 Night Records',
      musicbrainzUrl: 'https://musicbrainz.org/release/mb1',
      discogsUrl: null,
      tracks: [
        {
          id: 't1',
          title: 'Opening',
          position: 1,
          audioUrl: null,
          credits: [
            { role: 'producer', name: 'Aino', artistUsername: 'aino' },
            {
              role: 'mixing',
              name: 'mix@example.com',
              artistUsername: 'mixer',
            },
            { role: 'mastering', name: 'someone@example.com' },
          ],
        },
      ],
    });
    const credits = screen.getByRole('region', { name: 'Credits' });
    expect(
      within(credits).getByRole('link', { name: 'Aino' }).getAttribute('href'),
    ).toBe('/u/aino');
    expect(within(credits).getByRole('link', { name: 'mixer' })).toBeTruthy();
    expect(within(credits).queryByText(/@example\.com/)).toBeNull();
    expect(within(credits).queryByText(/Mastering/)).toBeNull();
    expect(within(credits).getByText('℗ 2026 Night Records')).toBeTruthy();
    expect(within(credits).getByText('© 2026 Night Records')).toBeTruthy();
    const mb = within(credits).getByRole('link', { name: /MusicBrainz/ });
    expect(mb.getAttribute('href')).toBe('https://musicbrainz.org/release/mb1');
    expect(within(credits).queryByRole('link', { name: /Discogs/ })).toBeNull();
  });

  it('leaves out the credits section when the API sends none', async () => {
    await renderSmartLink({});
    expect(screen.queryByRole('region', { name: 'Credits' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Locked tracks' })).toBeNull();
  });
});
