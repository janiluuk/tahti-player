// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioSoundsView } from './StudioSoundsView';

vi.mock('../../components/StudioGate', () => ({
  StudioGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../LibraryView', () => ({ LibrarySectionTabs: () => null }));
vi.mock('../../components/AddToMusicActions', () => ({
  AddToMusicActions: () => null,
}));
vi.mock('./sounds/TrackOrderButton', () => ({ TrackOrderButton: () => null }));
vi.mock('./sounds/SoundsAmbientList', () => ({
  SoundsAmbientList: ({ items }: { items: StudioSound[] }) => (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.title} — {item.status}
        </li>
      ))}
    </ul>
  ),
}));

const sound = {
  id: 's1',
  title: 'Moonlight Drive',
  status: 'READY',
  createdAt: '2026-10-01T00:00:00Z',
} as unknown as StudioSound;

describe('StudioSoundsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const emptyStats = {
    total: 0,
    durationSec: 0,
    publicCount: 0,
    privateCount: 0,
    processingCount: 0,
    errorCount: 0,
    readyCount: 0,
  };

  it('says the list failed to load instead of "No sounds yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioSoundsPage').mockResolvedValue({
      data: { items: [], total: 0 },
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    vi.spyOn(studio, 'fetchStudioSoundStats').mockResolvedValue({
      data: emptyStats,
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioSoundsView />);
    expect(await screen.findByText('Could not load your sounds')).toBeTruthy();
    expect(screen.queryByText('No sounds yet')).toBeNull();

    fetch.mockResolvedValue({
      data: { items: [sound], total: 1 },
      meta: { source: 'api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/Moonlight Drive/)).toBeTruthy();
  });

  it('offers to clear filters that match nothing', async () => {
    vi.spyOn(studio, 'fetchStudioSoundsPage').mockImplementation(
      async (query) => {
        const q = query.q?.toLowerCase() ?? '';
        const items =
          q && !sound.title.toLowerCase().includes(q) ? [] : [sound];
        return {
          data: { items, total: items.length },
          meta: { source: 'api' },
        };
      },
    );
    vi.spyOn(studio, 'fetchStudioSoundStats').mockResolvedValue({
      data: { ...emptyStats, total: 1, readyCount: 1, publicCount: 1 },
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioSoundsView />);
    await screen.findByText(/Moonlight Drive/);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zzz' },
    });
    expect(
      await screen.findByText(
        'No sounds match these filters',
        {},
        { timeout: 3000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByText('No sounds yet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText(/Moonlight Drive/)).toBeTruthy();
  });

  it('filters by a genre picked from the library facets', async () => {
    const page = vi.spyOn(studio, 'fetchStudioSoundsPage').mockResolvedValue({
      data: { items: [sound], total: 1 },
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'fetchStudioSoundStats').mockResolvedValue({
      data: emptyStats,
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'fetchStudioSoundFacets').mockResolvedValue({
      data: {
        facets: {
          genre: [
            { value: 'house', count: 1 },
            { value: 'ambient', count: 3 },
          ],
          tag: [{ value: 'live', count: 2 }],
        },
        total: 4,
      },
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioSoundsView />);
    await screen.findByText(/Moonlight Drive/);
    fireEvent.click(screen.getByRole('button', { name: 'Expand filters' }));
    const genre = await screen.findByRole('button', { name: /Genre/ });
    await act(async () => {
      fireEvent.click(genre);
    });
    const options = await screen.findAllByRole('option');
    expect(options.map((o) => o.textContent?.replace('✓', ''))).toEqual([
      'All genres',
      'ambient (3)',
      'house (1)',
    ]);
    await act(async () => {
      fireEvent.click(screen.getByRole('option', { name: 'ambient (3)' }));
    });
    await vi.waitFor(() =>
      expect(page).toHaveBeenLastCalledWith(
        expect.objectContaining({ genre: 'ambient' }),
      ),
    );
  });

  it('refreshes a pending upload until processing completes', async () => {
    const fetch = vi
      .spyOn(studio, 'fetchStudioSoundsPage')
      .mockResolvedValueOnce({
        data: { items: [{ ...sound, status: 'PROCESSING' }], total: 1 },
        meta: { source: 'api' },
      })
      .mockResolvedValue({
        data: { items: [sound], total: 1 },
        meta: { source: 'api' },
      });
    vi.spyOn(studio, 'fetchStudioSoundStats').mockResolvedValue({
      data: { ...emptyStats, total: 1, processingCount: 1 },
      meta: { source: 'api' },
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { unmount } = await renderWithRouter(<StudioSoundsView />);
      await screen.findByText(/PROCESSING/);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5100);
      });
      expect(await screen.findByText(/READY/)).toBeVisible();
      expect(fetch).toHaveBeenCalledTimes(2);
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });
});
