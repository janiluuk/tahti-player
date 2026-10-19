// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../../api/broadcast';
import * as shows from '../../api/shows';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioRecordingsView } from './StudioRecordingsView';

const RECORDING: broadcast.RecentBroadcast = {
  id: 'rec-1',
  title: 'Friday set',
  startedAt: '2026-10-01T20:00:00.000Z',
  endedAt: '2026-10-01T22:00:00.000Z',
  soundId: null,
};

describe('StudioRecordingsView', () => {
  beforeEach(() => {
    vi.spyOn(shows, 'fetchShowRefBySoundItemId').mockResolvedValue({
      data: new Map(),
      meta: { source: 'api' },
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the recordings failed to load instead of "No recorded shows yet"', async () => {
    const fetch = vi
      .spyOn(broadcast, 'fetchRecentBroadcasts')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    await renderWithRouter(<StudioRecordingsView embedded />);
    expect(
      await screen.findByText('Could not load your recordings'),
    ).toBeTruthy();
    expect(screen.queryByText('No recorded shows yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No recorded shows yet')).toBeTruthy();
  });

  it('clears a search that matches no recordings', async () => {
    vi.spyOn(broadcast, 'fetchRecentBroadcasts').mockResolvedValue({
      data: [RECORDING],
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioRecordingsView embedded />);
    fireEvent.change(await screen.findByLabelText('Search recordings'), {
      target: { value: 'polka' },
    });
    expect(screen.getByText('No recordings match your search')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.queryByText('No recordings match your search')).toBeNull();
  });
});
