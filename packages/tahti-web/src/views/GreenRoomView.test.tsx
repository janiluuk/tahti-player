// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as artistSettings from '../api/artist-settings';
import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { GreenRoomView } from './GreenRoomView';

const ACCESS: artistSettings.GreenRoomAccess = {
  hasAccess: true,
  channelState: 'OFFLINE',
  greenRoomEnabled: false,
  joinedAt: '2026-10-19T18:00:00.000Z',
  hlsUrl: null,
  artistUsername: 'aino',
  artistDisplayName: 'Aino',
};

describe('GreenRoomView', () => {
  beforeEach(() => {
    vi.spyOn(client, 'fetchProfile').mockResolvedValue({
      data: { channel: { slug: 'aino' } },
      meta: { source: 'api' },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lets a waiting guest check again once the artist opens the room', async () => {
    const access = vi
      .spyOn(artistSettings, 'fetchGreenRoomAccess')
      .mockResolvedValue({ ok: true, data: ACCESS });
    await renderWithRouter(<GreenRoomView username="aino" />);
    expect(await screen.findByText('Not open yet')).toBeTruthy();

    access.mockResolvedValue({
      ok: true,
      data: { ...ACCESS, greenRoomEnabled: true },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    await vi.waitFor(() => expect(access).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Not open yet')).toBeNull();
  });

  it('offers Check again when access could not be checked', async () => {
    vi.spyOn(artistSettings, 'fetchGreenRoomAccess').mockResolvedValue({
      ok: false,
      needsLogin: false,
      error: 'HTTP 502',
    });
    await renderWithRouter(<GreenRoomView username="aino" />);
    expect(await screen.findByText('Green room unavailable')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Check again' })).toBeTruthy();
  });
});
