// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
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
    usePlayerStore.setState(usePlayerStore.getInitialState());
    useAuthStore.setState({ user: null });
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
    expect(
      await within(screen.getByRole('status')).findByText('Artist - Song'),
    ).toBeTruthy();
    expect(
      screen.getByText('Programme guide').closest('a')?.getAttribute('href'),
    ).toBe('https://www.radiohelsinki.fi/ohjelmakartta/');
    expect(screen.getByRole('link', { name: 'YleX' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Radio Helsinki' })).toBeNull();
  });

  it('plays the stream and toggles it on the Listen page', async () => {
    const play = vi.fn();
    usePlayerStore.setState({ play, currentId: null });
    await renderStation('radio-helsinki');

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Station controls' })).getByRole(
        'button',
        { name: 'Play' },
      ),
    );
    expect(play).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'radio',
        streamUrl: 'https://stream.radiohelsinki.fi/stream',
      }),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Add to Listen' }),
    );
    expect(useListenerWidgetsStore.getState().enabledStationIds).toContain(
      'radio-helsinki',
    );
  });

  it('plays and pauses another station from its thumbnail without leaving the page', async () => {
    useListenerWidgetsStore.setState({
      stationOverrides: { ylex: { streamUrl: 'https://example.com/ylex.mp3' } },
    });
    await renderStation('radio-helsinki');
    const row = within(screen.getByTestId('other-stations'));
    const stationCard = row
      .getByRole('link', { name: 'YleX' })
      .closest('[data-testid="card"]') as HTMLElement;
    await userEvent.click(
      within(stationCard).getByRole('button', { name: 'Play', exact: true }),
    );
    expect(usePlayerStore.getState().currentId).toBe('radio-widget:ylex');
    expect(stationCard.getAttribute('data-playing')).toBe('true');
    expect(
      screen.getByRole('heading', { name: 'Radio Helsinki', level: 1 }),
    ).toBeTruthy();
    await userEvent.click(
      within(stationCard).getByRole('button', { name: 'Pause', exact: true }),
    );
    expect(usePlayerStore.getState().status).toBe('paused');
    expect(stationCard.hasAttribute('data-playing')).toBe(false);
    expect(screen.queryByRole('button', { name: /Edit .* cover/ })).toBeNull();
  });

  it('shows cover editing on the station page for board members, not on station cards', async () => {
    useAuthStore.setState({
      user: {
        id: 'board-1',
        email: 'board@tahti.live',
        username: 'board',
        displayName: 'Board',
        role: 'BOARD',
        isBoard: true,
      },
    });
    await renderStation('radio-helsinki');
    expect(
      screen.getByRole('button', { name: 'Edit Radio Helsinki cover' })
        .textContent,
    ).toContain('Edit cover image');
    expect(
      within(screen.getByTestId('other-stations')).queryByTestId(
        'radio-station-cover-edit',
      ),
    ).toBeNull();
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
