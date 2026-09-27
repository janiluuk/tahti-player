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
    await within(onAir).findByText("On air couldn't load");
    const tracks = await screen.findByTestId('listen-new-tracks');
    expect(tracks.getAttribute('data-status')).toBeNull();

    fireEvent.click(within(onAir).getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.getByTestId('listen-on-air').textContent).toContain(
        'Northern Lights',
      ),
    );
    expect(onAirSpy).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("On air couldn't load")).toBeNull();
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
    expect(within(onAir).getByText('Nobody is on air right now')).toBeTruthy();
    expect(within(onAir).queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});
