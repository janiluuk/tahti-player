// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { LibraryView } from './LibraryView';

vi.mock('./FavoritesView', () => ({ FavoritesView: () => null }));

describe('LibraryView tabs', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
  });
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('shows an artist the same listener tabs, with the catalog left to Studio', async () => {
    await renderWithRouter(<LibraryView tab="favorites" />);
    const tabs = (await screen.findAllByRole('tab')).map(
      (tab) => tab.textContent,
    );
    expect(tabs).toEqual(['Favorites', 'History', 'Media', 'Stash']);
  });

  it('opens on Favorites without an overview tab', async () => {
    await renderWithRouter(<LibraryView />);
    expect(
      await screen.findByRole('heading', { name: 'Favorites' }),
    ).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Overview/ })).toBeNull();
  });
});
