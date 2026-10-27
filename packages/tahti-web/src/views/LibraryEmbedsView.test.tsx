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

  it('searches embeds by title and clears the search from the empty state', async () => {
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [
        {
          id: 'e1',
          title: 'Harbour Dub',
          embedProvider: 'MIXCLOUD',
          embedUri: 'https://www.mixcloud.com/ada/harbour-dub/',
        },
        {
          id: 'e2',
          title: 'Polar Set',
          embedProvider: 'MIXCLOUD',
          embedUri: 'https://www.mixcloud.com/ada/polar-set/',
        },
      ],
      meta: { source: 'api' },
    } as never);
    await renderWithRouter(<LibraryEmbedsView />);
    expect(await screen.findByText('Harbour Dub')).toBeTruthy();

    const search = screen.getByRole('searchbox', { name: 'Search embeds' });
    fireEvent.change(search, { target: { value: 'polar' } });
    expect(screen.queryByText('Harbour Dub')).toBeNull();
    expect(screen.getByText('Polar Set')).toBeTruthy();

    fireEvent.change(search, { target: { value: 'nothing' } });
    expect(screen.getByText('No embeds match “nothing”')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Harbour Dub')).toBeTruthy();
  });
});
