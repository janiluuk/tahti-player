import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/admin';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { PlatformNewsDialog } from './PlatformNewsDialog';

const post = {
  id: 'post-1',
  headline: 'Opening day',
  summary: 'Come discover independent music.',
  authorName: 'Tahti team',
  publishedAt: '2026-10-30T08:00:00Z',
};

afterEach(() => {
  useAuthStore.setState({ user: null });
});

function boardSession() {
  useAuthStore.setState({
    user: {
      id: 'board',
      username: 'board',
      displayName: 'Board',
      email: 'board@example.com',
      role: 'BOARD',
      isBoard: true,
      isMember: true,
    },
    hydrated: true,
  });
}

describe('platform article editing', () => {
  it('saves the selected post through the admin API and updates the reader', async () => {
    boardSession();
    const update = vi
      .spyOn(api, 'updateNewsPost')
      .mockResolvedValue({ ok: true });
    const onUpdated = vi.fn();
    await renderWithRouter(
      <PlatformNewsDialog
        post={post}
        onClose={vi.fn()}
        onUpdated={onUpdated}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit article' }));
    await userEvent.clear(screen.getByLabelText('Headline'));
    await userEvent.type(screen.getByLabelText('Headline'), 'Tahti is open!');
    await userEvent.click(screen.getByRole('button', { name: 'Save article' }));
    await waitFor(() =>
      expect(onUpdated).toHaveBeenCalledWith({
        ...post,
        headline: 'Tahti is open!',
        imageUrl: null,
      }),
    );
    expect(update).toHaveBeenCalledWith(post.id, {
      headline: 'Tahti is open!',
      summary: post.summary,
      imageUrl: null,
    });
  });
  it('keeps the editor open and preserves changes when saving fails', async () => {
    boardSession();
    vi.spyOn(api, 'updateNewsPost').mockResolvedValue({
      ok: false,
      error: 'Could not save',
    });
    const onUpdated = vi.fn();
    await renderWithRouter(
      <PlatformNewsDialog
        post={post}
        onClose={vi.fn()}
        onUpdated={onUpdated}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit article' }));
    await userEvent.clear(screen.getByLabelText('Headline'));
    await userEvent.type(screen.getByLabelText('Headline'), 'New headline');
    await userEvent.click(screen.getByRole('button', { name: 'Save article' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save',
    );
    expect(screen.getByLabelText('Headline')).toHaveValue('New headline');
    expect(onUpdated).not.toHaveBeenCalled();
  });
  it('does not expose editing to anonymous readers', async () => {
    useAuthStore.setState({ user: null });
    await renderWithRouter(
      <PlatformNewsDialog post={post} onClose={vi.fn()} onUpdated={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Edit article' })).toBeNull();
  });
});
