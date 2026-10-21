// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { ChannelTracksPanel } from './ChannelTracksPanel';

const SOUND: admin.AdminChannelSound = {
  id: 's1',
  title: 'Aamu',
  artistName: null,
  description: 'Morning set',
  genre: 'Ambient',
  isPublic: true,
  releasedAt: '2026-09-01T00:00:00.000Z',
};

async function openChannel(slug: string) {
  render(<ChannelTracksPanel />);
  fireEvent.change(screen.getByLabelText('Channel slug'), {
    target: { value: slug },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Open tracks/ }));
  });
}

describe('ChannelTracksPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens a channel and saves an edited title', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAdminChannelSounds')
      .mockResolvedValue({ ok: true, data: [SOUND] });
    const patch = vi
      .spyOn(admin, 'patchAdminChannelSound')
      .mockResolvedValue({ ok: true, data: { ...SOUND, title: 'Aamu II' } });
    await openChannel(' Moon ');
    expect(fetch).toHaveBeenCalledWith('moon');

    fireEvent.click(screen.getByRole('button', { name: 'Edit Aamu' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Aamu II' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save track/ }));
    });

    expect(patch).toHaveBeenCalledWith('moon', 's1', {
      title: 'Aamu II',
      artistName: null,
      genre: 'Ambient',
      description: 'Morning set',
      isPublic: true,
    });
    expect(screen.getByText('Aamu II')).toBeTruthy();
  });

  it('shows the API error when the channel is not found', async () => {
    vi.spyOn(admin, 'fetchAdminChannelSounds').mockResolvedValue({
      ok: false,
      error: 'Channel not found',
    });
    await openChannel('nobody');
    expect(screen.getByRole('alert').textContent).toBe('Channel not found');
  });
});
