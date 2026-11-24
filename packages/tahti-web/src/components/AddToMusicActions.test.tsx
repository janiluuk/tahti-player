// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockSocial } from '../api/artist-settings/mock';
import * as socialApi from '../api/artist-settings/social';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { AddToMusicActions } from './AddToMusicActions';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AddToMusicActions', () => {
  it('opens the import wizard on its service choice instead of Settings', async () => {
    vi.spyOn(socialApi, 'fetchSocialConnections').mockResolvedValue({
      data: mockSocial,
      meta: { source: 'mock' },
    });
    const openSettings = vi.spyOn(useSettingsModalStore.getState(), 'open');
    await renderWithRouter(<AddToMusicActions uploadTo="/studio/upload" />, {
      paths: ['/studio/upload'],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(
      await screen.findByTestId('import-wizard-source-soundcloud'),
    ).toBeTruthy();
    expect(openSettings).not.toHaveBeenCalled();
  });
});
