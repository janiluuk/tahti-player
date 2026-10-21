// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/channel-comments';
import * as comments from '../api/comments';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { ChannelComments } from './ChannelComments';

const comment = (id: string, authorUsername: string) => ({
  id,
  body: `Comment ${id}`,
  authorUsername,
  authorDisplayName: authorUsername,
  authorAvatarUrl: null,
  createdAt: '2026-09-01T12:00:00.000Z',
});

async function renderComments(
  data: { comments: ReturnType<typeof comment>[]; commentsEnabled: boolean },
  { username, isOwner = false }: { username?: string; isOwner?: boolean } = {},
) {
  useAuthStore.setState({
    user: username ? ({ username } as AuthUser) : null,
  });
  vi.spyOn(api, 'fetchChannelComments').mockResolvedValue({
    data,
    meta: { source: 'api' },
  });
  const result = await act(async () =>
    render(<ChannelComments slug="night-drive" isOwner={isOwner} />),
  );
  return result;
}

describe('ChannelComments', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('posts a comment and deletes your own', async () => {
    await renderComments(
      {
        comments: [comment('c1', 'fan'), comment('c2', 'other')],
        commentsEnabled: true,
      },
      { username: 'fan' },
    );
    const list = screen.getByTestId('channel-comments');
    expect(
      within(list).getAllByRole('button', { name: /^Delete comment/ }),
    ).toHaveLength(1);
    expect(
      within(list).getAllByRole('button', { name: /^Report comment/ }),
    ).toHaveLength(1);

    const post = vi
      .spyOn(api, 'postChannelComment')
      .mockResolvedValue({ ok: true, data: comment('c3', 'fan') });
    fireEvent.change(screen.getByLabelText('Write a comment'), {
      target: { value: '  Great show  ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    });
    expect(post).toHaveBeenCalledWith('night-drive', 'Great show');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);

    const del = vi
      .spyOn(comments, 'deleteComment')
      .mockResolvedValue({ ok: true });
    await act(async () => {
      fireEvent.click(
        within(list).getAllByRole('button', {
          name: 'Delete comment by fan',
        })[0]!,
      );
    });
    expect(del).toHaveBeenCalledWith('c1');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('lets the owner delete any comment', async () => {
    await renderComments(
      { comments: [comment('c1', 'fan')], commentsEnabled: true },
      { username: 'artist', isOwner: true },
    );
    expect(
      screen.getByRole('button', { name: 'Delete comment by fan' }),
    ).toBeTruthy();
  });

  it('asks signed-out visitors to log in', async () => {
    await renderComments({ comments: [], commentsEnabled: true });
    expect(
      screen.getByRole('button', { name: 'Log in to comment' }),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Write a comment')).toBeNull();
  });

  it('hides the section when comments are off and there are none', async () => {
    const { container } = await renderComments(
      { comments: [], commentsEnabled: false },
      { username: 'fan' },
    );
    expect(container.textContent).toBe('');
  });

  it('keeps old comments visible but closes the composer when comments are off', async () => {
    await renderComments(
      { comments: [comment('c1', 'fan')], commentsEnabled: false },
      { username: 'fan' },
    );
    expect(screen.getByText('Comments are off for this channel.')).toBeTruthy();
    expect(screen.queryByLabelText('Write a comment')).toBeNull();
  });
});
