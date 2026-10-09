import { describe, expect, it } from 'vitest';

import type { QueueItem } from '@tahti-player/model';

import { queueWithPlaybackStatus } from './queueItemStatus';

const item = (id: string): QueueItem =>
  ({ id, status: 'idle', addedAtIso: '2026-10-09T00:00:00.000Z' }) as QueueItem;

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
});
