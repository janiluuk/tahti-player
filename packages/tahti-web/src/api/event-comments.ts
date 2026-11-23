import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from './client';
import { getJson } from './http';
import { mockFixture } from './mock-overrides';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';
import type { TrackComment } from './types';

let mockComments: TrackComment[] = [
  {
    id: 'mock-event-comment-1',
    body: 'See you on the dancefloor.',
    authorUsername: 'listener',
    authorDisplayName: 'Listener One',
    authorAvatarUrl: null,
    createdAt: '2026-09-20T18:00:00.000Z',
  },
];

export async function fetchEventComments(eventId: string): Promise<{
  data: { comments: TrackComment[]; commentsEnabled: boolean } | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture(
        'eventComments',
        { comments: mockComments, commentsEnabled: true },
        eventId,
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      comments: TrackComment[];
      commentsEnabled: boolean;
    }>(`/api/comments/event/${encodeURIComponent(eventId)}`);
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

export async function postEventComment(
  eventId: string,
  body: string,
): Promise<{ ok: true; data: TrackComment } | { ok: false; error: string }> {
  if (isForceMock()) {
    const comment: TrackComment = {
      id: `mock-event-comment-${Date.now()}`,
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
      `/api/comments/event/${encodeURIComponent(eventId)}`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch55.couldNotPostComment'),
    };
  }
}
