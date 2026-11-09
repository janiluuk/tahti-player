// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthModalStore } from '../../stores/authModalStore';
import type { TrackPage } from './buildTrackPage';
import { TRACK_COMMENT_INPUT_ID } from './helpers';
import { TrackBody } from './TrackBody';

function pageWith(overrides: Partial<TrackPage>): TrackPage {
  return {
    detail: null,
    comments: [],
    playable: { id: 'sound:s1', title: 'Kaamos', artist: 'Aurora' },
    tracklist: [],
    activeCueId: null,
    relatedTracks: [],
    relatedCollections: [],
    jumpTo: vi.fn(),
    canDeleteComment: () => false,
    removeComment: vi.fn(),
    deletingCommentId: null,
    user: null,
    commentsEnabled: true,
    setCommentComposerOpen: vi.fn(),
    ...overrides,
  } as unknown as TrackPage;
}

describe('TrackBody comments empty state', () => {
  afterEach(() => {
    cleanup();
    useAuthModalStore.setState({ isOpen: false, mode: 'login' });
  });

  it('Be the first to comment opens the composer and focuses it', async () => {
    const setCommentComposerOpen = vi.fn();
    render(
      <>
        <input id={TRACK_COMMENT_INPUT_ID} aria-label="Write a comment" />
        <TrackBody
          page={pageWith({
            user: { id: 'u1', username: 'liina' } as TrackPage['user'],
            setCommentComposerOpen,
          })}
        />
      </>,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Be the first to comment' }),
      );
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(setCommentComposerOpen).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText('Write a comment')).toHaveFocus();
  });

  it('asks a signed-out visitor to log in', () => {
    render(<TrackBody page={pageWith({})} />);
    fireEvent.click(screen.getByRole('button', { name: 'Log in to comment' }));
    expect(useAuthModalStore.getState().isOpen).toBe(true);
  });

  it('offers nothing when comments are off', () => {
    render(<TrackBody page={pageWith({ commentsEnabled: false })} />);
    expect(screen.getByText('No comments yet.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
