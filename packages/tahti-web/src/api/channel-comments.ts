import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';
import type { TrackComment } from './types';

let mockComments: TrackComment[] = [
  {
    id: 'mock-channel-comment-1',
    body: 'Best Sunday stream around.',
    authorUsername: 'listener',
    authorDisplayName: 'Listener One',
    authorAvatarUrl: null,
    createdAt: '2026-09-20T18:00:00.000Z',
  },
];

export async function fetchChannelComments(slug: string): Promise<{
  data: { comments: TrackComment[]; commentsEnabled: boolean } | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { comments: mockComments, commentsEnabled: true },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      comments: TrackComment[];
      commentsEnabled: boolean;
    }>(`/api/comments/channel/${encodeURIComponent(slug)}`);
    return {
      data: {
        comments: Array.isArray(data.comments) ? data.comments : [],
        commentsEnabled: data.commentsEnabled,
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function postChannelComment(
  slug: string,
  body: string,
): Promise<{ ok: true; data: TrackComment } | { ok: false; error: string }> {
  if (isForceMock()) {
    const comment: TrackComment = {
      id: `mock-channel-comment-${Date.now()}`,
      body,
      authorUsername: 'you',
      authorDisplayName: 'You',
      authorAvatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    mockComments = [...mockComments, comment];
    return { ok: true, data: comment };
  }
  try {
    const { data } = await requestJson<TrackComment>(
      `/api/comments/channel/${encodeURIComponent(slug)}`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not post comment',
    };
  }
}
