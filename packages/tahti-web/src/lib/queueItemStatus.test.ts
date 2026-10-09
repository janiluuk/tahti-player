import { describe, expect, it } from 'vitest';

import type { QueueItem } from '@tahti-player/model';

import { queueWithPlaybackStatus } from './queueItemStatus';

const item = (id: string, url: string | null = 'https://cdn.example/a.mp3') =>
  ({
    id,
    status: 'idle',
    addedAtIso: '2026-10-09T00:00:00.000Z',
    track: { source: { provider: 'tahti', id, url: url ?? undefined } },
  }) as QueueItem;

const QUEUE = [item('a'), item('b'), item('c')];

describe('queueWithPlaybackStatus', () => {
  it('marks only the current row as loading', () => {
    const rows = queueWithPlaybackStatus(QUEUE, 'b', 'loading', null);
    expect(rows.map((r) => r.status)).toEqual(['idle', 'loading', 'idle']);
    expect(rows[0]).toBe(QUEUE[0]);
  });

  it("marks the current row as failed, with the player's message", () => {
    const rows = queueWithPlaybackStatus(QUEUE, 'c', 'error', 'Playback error');
    expect(rows[2]).toMatchObject({ status: 'error', error: 'Playback error' });
    expect(rows[1].status).toBe('idle');
  });

  it('returns the same queue while playing, paused or idle', () => {
    for (const status of ['playing', 'paused', 'idle'] as const) {
      expect(queueWithPlaybackStatus(QUEUE, 'a', status, null)).toBe(QUEUE);
    }
    expect(queueWithPlaybackStatus(QUEUE, null, 'loading', null)).toBe(QUEUE);
  });

  it('shows restored local tracks as loading until their file is found', () => {
    const queue = [
      item('local:1', null),
      item('local:2', 'asset://2'),
      item('sound:x', null),
    ];
    const rows = queueWithPlaybackStatus(queue, null, 'paused', null);
    expect(rows.map((r) => r.status)).toEqual(['loading', 'idle', 'idle']);
    expect(rows[1]).toBe(queue[1]);
  });

  it('keeps a failed current row failed even when it is a local track', () => {
    const queue = [item('local:1', null), item('local:2', null)];
    const rows = queueWithPlaybackStatus(
      queue,
      'local:1',
      'error',
      'File missing',
    );
    expect(rows[0]).toMatchObject({ status: 'error', error: 'File missing' });
    expect(rows[1].status).toBe('loading');
  });
});
