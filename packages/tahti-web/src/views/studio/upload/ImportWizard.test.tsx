// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockSocial } from '../../../api/artist-settings/mock';
import * as socialApi from '../../../api/artist-settings/social';
import * as sources from '../../../api/sources';
import * as soundcloud from '../../../api/sources/soundcloud';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { ImportWizard } from './ImportWizard';

const social = {
  ...mockSocial,
  soundcloud: '',
};

describe('ImportWizard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('skips setup when a SoundCloud profile is already saved', async () => {
    vi.spyOn(socialApi, 'fetchSocialConnections').mockResolvedValue({
      data: { ...social, soundcloud: 'https://soundcloud.com/demo' },
      meta: { source: 'mock' },
    });
    vi.spyOn(soundcloud, 'fetchSoundcloudTracks').mockResolvedValue({
      data: [{ id: 'sc-1', title: 'Polar Nights' }],
      meta: { source: 'mock' },
    });
    vi.spyOn(soundcloud, 'fetchSoundcloudPlaylists').mockResolvedValue([]);
    vi.spyOn(sources, 'fetchConnectionStatus').mockResolvedValue({
      data: { connected: false, configured: true },
      meta: { source: 'mock' },
    });

    await renderWithRouter(
      <ImportWizard start="soundcloud" onClose={() => undefined} />,
    );

    expect(
      await screen.findByRole('checkbox', { name: 'Polar Nights' }),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/profile link/i)).toBeNull();
  });

  it('asks for a profile when SoundCloud is not connected', async () => {
    vi.spyOn(socialApi, 'fetchSocialConnections').mockResolvedValue({
      data: social,
      meta: { source: 'mock' },
    });
    vi.spyOn(sources, 'fetchConnectionStatus').mockResolvedValue({
      data: { connected: false, configured: true },
      meta: { source: 'mock' },
    });

    await renderWithRouter(
      <ImportWizard start="soundcloud" onClose={() => undefined} />,
    );

    expect(await screen.findByLabelText(/profile link/i)).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Polar Nights' })).toBeNull();
  });

  it('imports the selected track and fills the progress bar', async () => {
    vi.spyOn(socialApi, 'fetchSocialConnections').mockResolvedValue({
      data: { ...social, soundcloud: 'https://soundcloud.com/demo' },
      meta: { source: 'mock' },
    });
    vi.spyOn(soundcloud, 'fetchSoundcloudTracks').mockResolvedValue({
      data: [{ id: 'sc-1', title: 'Polar Nights' }],
      meta: { source: 'mock' },
    });
    vi.spyOn(soundcloud, 'fetchSoundcloudPlaylists').mockResolvedValue([]);
    const imported = vi
      .spyOn(soundcloud, 'importSoundcloudTracks')
      .mockResolvedValue({ ok: true, count: 1 });

    await renderWithRouter(
      <ImportWizard start="soundcloud" onClose={() => undefined} />,
    );

    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Polar Nights' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByText('This is what will be imported'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import selected' }));
    const bar = await screen.findByRole('progressbar', { name: 'Importing' });
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('1');
    expect(imported).toHaveBeenCalledWith([
      { trackId: 'sc-1', title: 'Polar Nights' },
    ]);
  });
});
