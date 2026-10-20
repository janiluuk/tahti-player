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
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as discover from '../api/discover';
import * as listen from '../api/listen';
import { clearListenSectionCache } from '../components/listen-view/useListenSections';
import { useLibraryStore } from '../stores/libraryStore';
import {
  BROWSER_STATIONS_BLOCK_ID,
  useListenerWidgetsStore,
} from '../stores/listenerWidgetsStore';
import { ListenView } from './ListenView';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

vi.mock('../api/radio-sources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/radio-sources')>()),
  readIcyStreamTitle: async () => null,
}));

function never<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

async function renderListen() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <ListenView /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('ListenView sections', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    clearListenSectionCache();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('shows a loading state for a slow section while the others render', async () => {
    vi.spyOn(discover, 'fetchLatestTracks').mockImplementation(never);
    await renderListen();

    const tracks = await screen.findByTestId('listen-new-tracks');
    expect(tracks.getAttribute('data-status')).toBe('loading');
    expect(within(tracks).getByText('Loading new tracks…')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByTestId('listen-on-air').textContent).toContain(
        'Northern Lights',
      ),
    );
  });

  it('shows Retry on a failed section without affecting the others', async () => {
    const onAirSpy = vi
      .spyOn(listen, 'fetchOnAirChannels')
      .mockResolvedValueOnce({
        data: { live: [], replaying: [], recent: [] },
        meta: { source: 'api', reason: 'HTTP 503' },
      });
    await renderListen();

    const onAir = await screen.findByTestId('listen-on-air');
    await within(onAir).findByText("Live now couldn't load");
    const tracks = await screen.findByTestId('listen-new-tracks');
    expect(tracks.getAttribute('data-status')).toBeNull();

    fireEvent.click(within(onAir).getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.getByTestId('listen-on-air').textContent).toContain(
        'Northern Lights',
      ),
    );
    expect(onAirSpy).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Live now couldn't load")).toBeNull();
  });

  it('shows an empty state, not an error, when nothing is on air', async () => {
    vi.spyOn(listen, 'fetchOnAirChannels').mockResolvedValue({
      data: { live: [], replaying: [], recent: [] },
      meta: { source: 'api' },
    });
    await renderListen();

    const onAir = await screen.findByTestId('listen-on-air');
    await waitFor(() =>
      expect(onAir.getAttribute('data-status')).toBe('ready'),
    );
    expect(within(onAir).getByText('Nobody is live right now')).toBeTruthy();
    expect(within(onAir).queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('lists a replaying channel under Replays, not Live now', async () => {
    const { data } = await listen.fetchOnAirChannels();
    const channel = [...data.live, ...data.replaying][0]!;
    vi.spyOn(listen, 'fetchOnAirChannels').mockResolvedValue({
      data: { live: [], replaying: [channel], recent: [] },
      meta: { source: 'api' },
    });
    await renderListen();

    const replays = await screen.findByTestId('listen-replays');
    expect(replays.textContent).toContain(channel.user.displayName);
    const live = screen.getByTestId('listen-on-air');
    expect(within(live).getByText('Nobody is live right now')).toBeTruthy();
    expect(
      within(live).getByText('Recent broadcasts are replaying below.'),
    ).toBeTruthy();
  });

  it('links a recently played radio station to its station page', async () => {
    useLibraryStore.setState({
      history: [
        {
          playable: {
            id: 'radio-widget:radio-helsinki',
            kind: 'radio',
            title: 'Radio Helsinki',
            artist: 'Finnish · Talk / Variety',
            streamUrl: 'https://example.test/stream',
            protocol: 'https',
          },
          playedAt: '2026-10-04T10:00:00.000Z',
        },
        {
          playable: {
            id: 'sound:s1',
            kind: 'sound',
            title: 'Night Drive',
            artist: 'Northern Lights',
            streamUrl: 'https://example.test/s1.mp3',
            protocol: 'https',
          },
          playedAt: '2026-10-04T09:00:00.000Z',
        },
      ],
    });
    await renderListen();

    // The Radio row's own station card is one link; the history card is the
    // second.
    await waitFor(() =>
      expect(
        screen
          .getAllByRole('link', { name: 'Radio Helsinki' })
          .filter(
            (link) =>
              link.getAttribute('href') === '/radio/station/radio-helsinki',
          ),
      ).toHaveLength(2),
    );
    expect(
      within(screen.getByTestId('listen-recently-played')).queryByRole('link', {
        name: 'Night Drive',
      }),
    ).toBeNull();
    useLibraryStore.setState({ history: [] });
  });
});

describe('ListenView block order', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    clearListenSectionCache();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    useListenerWidgetsStore.setState({
      instances: [],
      installedTypeIds: [],
      savedBrowserStations: [],
      listenOrder: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const blockIds = () =>
    Array.from(
      screen
        .getByTestId('listen-dashboard')
        .querySelectorAll<HTMLElement>('[data-sortable-block]'),
    ).map((node) => node.dataset.sortableBlock);

  it('puts a widget added from the store above every section', async () => {
    await renderListen();
    expect(blockIds()[0]).toBe('tahti-radio');

    act(() => {
      useListenerWidgetsStore.getState().addSavedBrowserStation({
        id: 'kexp',
        name: 'KEXP',
        streamUrl: 'https://kexp.example/stream',
      });
    });

    expect(blockIds()[0]).toBe(BROWSER_STATIONS_BLOCK_ID);
    expect(blockIds()[1]).toBe('tahti-radio');
  });

  it('shows drag handles only while the Order toggle is on', async () => {
    await renderListen();
    expect(
      screen.queryByRole('button', { name: 'Move Tahti Radio' }),
    ).toBeNull();

    const toggle = screen.getByRole('button', { name: 'Order sections' });
    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(
      screen.getByRole('button', { name: 'Move Tahti Radio' }),
    ).toBeTruthy();

    fireEvent.click(toggle);
    expect(
      screen.queryByRole('button', { name: 'Move Tahti Radio' }),
    ).toBeNull();
  });

  it('follows the stored order and keeps unknown sections by their neighbours', async () => {
    useListenerWidgetsStore.setState({ listenOrder: ['radio', 'tahti-radio'] });
    await renderListen();
    const ids = blockIds();
    expect(ids[0]).toBe('radio');
    expect(ids[1]).toBe('news');
    expect(ids.indexOf('tahti-radio')).toBeLessThan(ids.indexOf('selects'));
    expect(ids.indexOf('new-tracks')).toBeGreaterThan(
      ids.indexOf('tahti-radio'),
    );
  });
});
