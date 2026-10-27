// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as sources from '../../../api/sources';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { UploadSourceWidgets } from './UploadSourceWidgets';

describe('UploadSourceWidgets', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens setup help for a source the server has not set up', async () => {
    vi.spyOn(sources, 'fetchConnectionStatus').mockImplementation(
      async (id) => ({
        data:
          id === 'soundcloud'
            ? { connected: false, configured: false }
            : { connected: true, configured: true },
        meta: { source: 'api' },
      }),
    );
    await renderWithRouter(<UploadSourceWidgets />);

    const card = await screen.findByText('SoundCloud');
    expect(await screen.findByText('Not available yet')).toBeTruthy();
    expect(screen.queryByText('Needs setup')).toBeNull();
    fireEvent.click(card);

    expect(
      await screen.findByText(/SoundCloud is not switched on for Tahti yet/),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Upload files' })).toBeTruthy();
  });

  it('lists only sources it can import from', async () => {
    vi.spyOn(sources, 'fetchConnectionStatus').mockResolvedValue({
      data: { connected: true, configured: true },
      meta: { source: 'api' },
    });
    await renderWithRouter(<UploadSourceWidgets />);
    await screen.findByText('SoundCloud');
    for (const name of ['Bandcamp', 'Mixcloud']) {
      expect(screen.queryByText(name)).toBeNull();
    }
    expect(screen.getByText('Google Drive')).toBeTruthy();
    expect(screen.getByText('hearthis.at')).toBeTruthy();
  });
});
