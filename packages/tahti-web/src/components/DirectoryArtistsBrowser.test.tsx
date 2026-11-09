// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { ChannelDirectoryItem } from '../api/types';
import { renderWithRouter } from '../test/renderWithRouter';
import { DirectoryArtistsBrowser } from './DirectoryArtistsBrowser';

const artist = (name: string, genres: string[]): ChannelDirectoryItem => ({
  slug: name,
  username: name,
  displayName: name,
  avatarUrl: null,
  genres,
});

const GENRES = 'abcdefghij'.split('').map((letter) => `Genre ${letter}`);
const artists = [
  artist('one', ['Genre a', ...GENRES.slice(1, 5)]),
  artist('two', ['Genre a', ...GENRES.slice(5)]),
];

describe('DirectoryArtistsBrowser genre chips', () => {
  afterEach(cleanup);

  it('shows the top genres, hides counts of one and folds the rest', async () => {
    await renderWithRouter(<DirectoryArtistsBrowser artists={artists} />);
    const group = screen.getByRole('radiogroup', { name: 'Genre' });
    expect(group.textContent).toContain('Genre a (2)');
    expect(group.textContent).not.toContain('(1)');
    expect(screen.queryByText('Genre j')).toBeNull();
    fireEvent.click(screen.getByText('+2 more'));
    expect(screen.getByText('Genre j')).toBeTruthy();
    fireEvent.click(screen.getByText('Fewer genres'));
    expect(screen.queryByText('Genre j')).toBeNull();
  });

  it('sizes the search field from its wrapper so it cannot be squashed', async () => {
    await renderWithRouter(<DirectoryArtistsBrowser artists={artists} />);
    const wrapper = screen.getByTestId('directory-artists-search');
    expect(wrapper.className).toContain('min-w-48');
    expect(wrapper.className).toContain('flex-1');
    const field = screen.getByRole('searchbox', { name: 'Search' });
    expect(field.className).not.toContain('min-w-48');
  });
});
