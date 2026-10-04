// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { CommentItem } from './CommentItem';

const COMMENT = {
  id: 'c1',
  body: '[1:30] Nice drop',
  authorUsername: 'fan',
  authorDisplayName: 'Fan',
  authorAvatarUrl: null,
  createdAt: '2026-09-01T12:00:00.000Z',
};

describe('CommentItem', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null });
  });

  it('shows the author and text, and deletes when allowed', () => {
    const onDelete = vi.fn();
    render(
      <ul>
        <CommentItem comment={COMMENT} text="Nice drop" onDelete={onDelete} />
      </ul>,
    );
    expect(screen.getByText('Fan')).toBeTruthy();
    expect(screen.getByText('Nice drop')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete comment by Fan' }),
    );
    expect(onDelete).toHaveBeenCalled();
  });

  it('has no delete button without permission', () => {
    render(
      <ul>
        <CommentItem comment={COMMENT} />
      </ul>,
    );
    expect(screen.getByText('[1:30] Nice drop')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Delete/ })).toBeNull();
  });

  it("offers to report someone else's comment", () => {
    render(
      <ul>
        <CommentItem comment={COMMENT} />
      </ul>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Report comment by Fan' }),
    );
    expect(screen.getByText('Harassment or abuse')).toBeTruthy();
  });

  it('has no report button on your own comment', () => {
    useAuthStore.setState({
      user: { username: 'fan' } as ReturnType<
        typeof useAuthStore.getState
      >['user'],
    });
    render(
      <ul>
        <CommentItem comment={COMMENT} />
      </ul>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
