// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../api/studio';
import { renderWithRouter } from '../test/renderWithRouter';
import { LibraryEmbedsView } from './LibraryEmbedsView';

vi.mock('../components/SoundCloudEmbedsPanel', () => ({
  SoundCloudEmbedsPanel: () => null,
}));

describe('LibraryEmbedsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the embeds failed to load instead of "No imported embeds yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<LibraryEmbedsView />);
    expect(
      await screen.findByText('Could not load your imported embeds'),
    ).toBeTruthy();
    expect(screen.queryByText('No imported embeds yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No imported embeds yet')).toBeTruthy();
  });
});
