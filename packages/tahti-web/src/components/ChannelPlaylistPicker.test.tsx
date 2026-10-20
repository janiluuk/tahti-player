// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../api/studio';
import { ChannelPlaylistPicker } from './ChannelPlaylistPicker';

describe('ChannelPlaylistPicker', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows PageError text on an api load failure and recovers on retry', async () => {
    const fetchCollections = vi
      .spyOn(studio, 'fetchStudioCollections')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    render(<ChannelPlaylistPicker onPick={() => undefined} />);
    expect(await screen.findByText('Could not load playlists')).toBeTruthy();
    expect(screen.getByText('HTTP 502')).toBeTruthy();
    expect(screen.queryByText(/No playlists in your library yet/)).toBeNull();

    fetchCollections.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText(/No playlists in your library yet/),
    ).toBeTruthy();
  });
});
