// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../../api/client';
import type { MotionComment } from '../../api/governance-member';
import type { GovernanceMotion } from '../../api/types';
import { useAuthStore } from '../../stores/authStore';
import { MotionDiscussion } from './MotionDiscussion';

const removeMotionComment = vi.fn();

vi.mock('../../api/governance-comments', () => ({
  removeMotionComment: (motionId: string, commentId: string) =>
    removeMotionComment(motionId, commentId),
}));

const motion: GovernanceMotion = { id: 'm1', title: 'Motion', state: 'OPEN' };

const comments: MotionComment[] = [
  {
    id: '1',
    body: 'Mine',
    authorId: 'me',
    authorDisplayName: 'Me',
    createdAt: '2026-10-14T10:00:00.000Z',
  },
  {
    id: '2',
    body: 'Theirs',
    authorId: 'other',
    authorDisplayName: 'Other',
    createdAt: '2026-10-14T10:01:00.000Z',
  },
  {
    id: '3',
    body: '',
    authorId: 'other',
    authorDisplayName: 'Other',
    createdAt: '2026-10-14T10:02:00.000Z',
    removed: true,
  },
];

function signIn(isBoard: boolean) {
  useAuthStore.setState({
    user: {
      id: 'me',
      email: 'me@tahti.live',
      username: 'me',
      displayName: 'Me',
      role: isBoard ? 'BOARD' : 'ARTIST',
      isBoard,
      isMember: true,
    },
    hydrated: true,
    loading: false,
  });
}

function renderDiscussion(state = 'OPEN') {
  return render(
    <MotionDiscussion
      motion={{ ...motion, state }}
      canPost={state !== 'CLOSED'}
      defaultExpanded
      preloadedComments={comments}
      onMessage={() => {}}
      onChanged={() => {}}
    />,
  );
}

describe('MotionDiscussion comment removal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('shows a removed comment as removed', () => {
    signIn(false);
    renderDiscussion();

    expect(screen.getByText('Comment removed.')).toBeTruthy();
  });

  it("lets a member remove only their own comment while the motion isn't closed", () => {
    signIn(false);
    renderDiscussion();

    expect(
      screen.getAllByRole('button', { name: /^Remove the comment/ }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Remove the comment by Me' }),
    ).toBeTruthy();
  });

  it('keeps a closed motion’s discussion for a member', () => {
    signIn(false);
    renderDiscussion('CLOSED');

    expect(
      screen.queryByRole('button', { name: /^Remove the comment/ }),
    ).toBeNull();
  });

  it('lets the board remove any comment that is still up, even after closing', async () => {
    signIn(true);
    removeMotionComment.mockResolvedValue({ ok: true });
    renderDiscussion('CLOSED');

    expect(
      screen.getAllByRole('button', { name: /^Remove the comment/ }),
    ).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove the comment by Other' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    await vi.waitFor(() =>
      expect(screen.getAllByText('Comment removed.')).toHaveLength(2),
    );
    expect(removeMotionComment).toHaveBeenCalledWith('m1', '2');
    expect(screen.queryByText('Theirs')).toBeNull();
  });
});

describe('MotionDiscussion load failure', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('says the discussion failed to load instead of "No comments yet"', async () => {
    signIn(false);
    const fetch = vi.spyOn(client, 'fetchMotionComments').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(
      <MotionDiscussion
        motion={motion}
        canPost
        defaultExpanded
        onMessage={() => {}}
        onChanged={() => {}}
      />,
    );
    expect(
      await screen.findByText('Could not load the discussion'),
    ).toBeTruthy();
    expect(screen.queryByText('No comments yet.')).toBeNull();

    fetch.mockResolvedValue({ data: comments, meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Theirs')).toBeTruthy();
  });
});
