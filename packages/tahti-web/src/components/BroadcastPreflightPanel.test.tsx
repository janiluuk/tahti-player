// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchBroadcastPreflight,
  patchBroadcastPreflight,
  type BroadcastPreflight,
} from '../api/broadcast';
import { fetchShowSeries } from '../api/shows';
import { fetchMeProfile } from '../api/studio-extras';
import { BroadcastPreflightPanel } from './BroadcastPreflightPanel';

vi.mock('../api/broadcast', () => ({
  fetchBroadcastPreflight: vi.fn(),
  patchBroadcastPreflight: vi.fn(),
}));
vi.mock('../api/shows', () => ({ fetchShowSeries: vi.fn() }));
vi.mock('../api/studio-extras', () => ({ fetchMeProfile: vi.fn() }));
vi.mock('../api/artist-settings', () => ({ uploadProfileAvatar: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const BASE: BroadcastPreflight = {
  title: 'Friday set',
  visibility: 'PUBLIC',
  autoPublish: true,
  showType: 'LIVE_SET',
  episodeNumber: null,
  tagline: null,
  plannedRadioShow: null,
  plannedLiveShow: null,
};

const SERIES = {
  id: 'series-1',
  title: 'Friday Frequency',
  description: '',
  coverUrl: null,
  showType: 'LIVE_SET' as const,
  nextEpisodeNumber: 4,
  intervalHours: 2 as const,
  scheduleNote: null,
  createdAt: '2026-10-16T00:00:00.000Z',
};

function seriesPicker() {
  return screen.getByRole('button', { name: 'Series episode' });
}

async function renderPanel() {
  await act(async () => {
    render(<BroadcastPreflightPanel />);
  });
}

describe('BroadcastPreflightPanel series episode', () => {
  beforeEach(() => {
    vi.mocked(fetchBroadcastPreflight).mockResolvedValue({
      data: BASE,
      meta: { source: 'mock' },
    });
    vi.mocked(fetchShowSeries).mockResolvedValue({
      data: [SERIES],
      meta: { source: 'mock' },
    });
    vi.mocked(fetchMeProfile).mockResolvedValue({
      data: { avatarUrl: null } as Awaited<
        ReturnType<typeof fetchMeProfile>
      >['data'],
      meta: { source: 'mock' },
    });
    vi.mocked(patchBroadcastPreflight).mockImplementation(async (patch) => ({
      data: {
        ...BASE,
        ...patch,
        episodeNumber: SERIES.nextEpisodeNumber,
        plannedLiveShow: {
          seriesId: patch.seriesId ?? '',
          episodeNumber: SERIES.nextEpisodeNumber,
        },
      },
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers Retry when the show details fail to load', async () => {
    vi.mocked(fetchBroadcastPreflight).mockResolvedValueOnce({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderPanel();
    expect(screen.getByText('Could not load your show details')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.getByDisplayValue('Friday set')).toBeTruthy();
  });

  it('sends the picked series and shows the planned episode after saving', async () => {
    await renderPanel();

    expect(screen.queryByLabelText('Episode')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Series episode' }));
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('option', { name: 'Friday Frequency — next #4' }),
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save show info' }));
    });

    expect(patchBroadcastPreflight).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Friday set', seriesId: 'series-1' }),
    );
    expect((screen.getByLabelText('Episode') as HTMLInputElement).value).toBe(
      '4',
    );
    expect(seriesPicker()).toBeDisabled();
    expect(seriesPicker()).toHaveTextContent('Friday Frequency — next #4');
  });

  it('keeps one-off broadcasts free of a series id', async () => {
    await renderPanel();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save show info' }));
    });
    const patch = vi.mocked(patchBroadcastPreflight).mock.calls[0]![0];
    expect(patch).not.toHaveProperty('seriesId');
  });

  it('shows the planned episode of a series that is already picked', async () => {
    vi.mocked(fetchBroadcastPreflight).mockResolvedValue({
      data: {
        ...BASE,
        episodeNumber: 4,
        plannedLiveShow: { seriesId: 'series-1', episodeNumber: 4 },
      },
      meta: { source: 'mock' },
    });
    await renderPanel();
    expect((screen.getByLabelText('Episode') as HTMLInputElement).value).toBe(
      '4',
    );
    expect(seriesPicker()).toBeDisabled();
    expect(seriesPicker()).toHaveTextContent('Friday Frequency — next #4');
  });
});
