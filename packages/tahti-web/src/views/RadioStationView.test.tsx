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
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';
import { RadioStationView } from './RadioStationView';

const icy = vi.hoisted(() => ({ title: null as string | null }));

vi.mock('../api/radio-sources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/radio-sources')>()),
  readIcyStreamTitle: async () => icy.title,
}));

async function renderStation(stationId: string) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <RadioStationView stationId={stationId} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('RadioStationView', () => {
  beforeEach(() => {
    icy.title = null;
    useListenerWidgetsStore.setState({
      enabledStationIds: ['ylex'],
      stationOverrides: {},
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the station, its stream details, what is on air and links', async () => {
    icy.title = 'Artist - Song';
    await renderStation('radio-helsinki');

    expect(screen.getByText('Radio Helsinki')).toBeTruthy();
    expect(screen.getByText('MP3 · 256 kbps')).toBeTruthy();
    expect(await screen.findByText('Artist - Song')).toBeTruthy();
    expect(
      screen.getByText('Programme guide').closest('a')?.getAttribute('href'),
    ).toBe('https://www.radiohelsinki.fi/ohjelmakartta/');
    expect(screen.getByText('YleX').closest('a')).toBeTruthy();
    expect(screen.queryByText('Radio Helsinki', { selector: 'a' })).toBeNull();
  });

  it('plays the stream and toggles it on the Listen page', async () => {
    const play = vi.fn();
    usePlayerStore.setState({ play, currentId: null });
    await renderStation('radio-helsinki');

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(play).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'radio',
        streamUrl: 'https://stream.radiohelsinki.fi/stream',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add to Listen' }));
    expect(useListenerWidgetsStore.getState().enabledStationIds).toContain(
      'radio-helsinki',
    );
  });

  it('uses a listener override for the stream and says when a station is unknown', async () => {
    useListenerWidgetsStore.setState({
      stationOverrides: { ylex: { name: 'YleX (mine)' } },
    });
    await renderStation('ylex');
    expect(screen.getByText('YleX (mine)')).toBeTruthy();
    cleanup();

    await renderStation('nope');
    expect(screen.getByText('Station not found')).toBeTruthy();
  });
});
