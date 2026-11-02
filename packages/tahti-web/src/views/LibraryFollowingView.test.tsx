import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as follows from '../api/follows';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { LibraryFollowingView } from './LibraryFollowingView';

const user = (username: string, displayName = '') => ({
  username,
  displayName,
  avatarUrl: null,
});

describe('LibraryFollowingView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'liina', role: 'LISTENER' } as never,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lists who you follow, falling back to the username, and pages on', async () => {
    const fetch = vi
      .spyOn(follows, 'fetchFollowList')
      .mockResolvedValueOnce({
        users: [user('kaamos', 'Kaamos Crew'), user('noname')],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        users: [user('third', 'Third')],
        hasMore: false,
      });

    await renderWithRouter(<LibraryFollowingView />, {
      paths: ['/u/$username'],
    });

    expect(await screen.findByText('Kaamos Crew')).toBeInTheDocument();
    expect(screen.getAllByText('noname')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('liina', 'following', 0);

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(await screen.findByText('Third')).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith('liina', 'following', 2);
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });

  it('says so when you follow nobody, and offers a retry on error', async () => {
    vi.spyOn(follows, 'fetchFollowList')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ users: [], hasMore: false });

    await renderWithRouter(<LibraryFollowingView />);
    fireEvent.click(await screen.findByRole('button', { name: /retry/i }));
    await waitFor(() =>
      expect(
        screen.getByText("You don't follow anyone yet"),
      ).toBeInTheDocument(),
    );
  });
});
