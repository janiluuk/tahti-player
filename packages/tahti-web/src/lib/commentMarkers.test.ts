import { describe, expect, it } from 'vitest';

import type { TrackComment } from '../api/types';
import { buildCommentMarkers } from './commentMarkers';

const comment = (id: string, body: string, author = 'Aino'): TrackComment => ({
  id,
  body,
  authorUsername: author.toLowerCase(),
  authorDisplayName: author,
  authorAvatarUrl: null,
  createdAt: '2026-10-01T12:00:00.000Z',
});

describe('buildCommentMarkers', () => {
  it('labels a timed comment with time, author and text', () => {
    expect(
      buildCommentMarkers([comment('a', '[1:05] love this break')], 200),
    ).toEqual([
      {
        fraction: 65 / 200,
        seconds: 65,
        label: '1:05 · Aino: love this break',
        count: 1,
      },
    ]);
  });

  it('groups comments within 1.5% of the track and skips untimed ones', () => {
    const markers = buildCommentMarkers(
      [
        comment('a', '[0:40] one'),
        comment('b', 'no time here'),
        comment('c', '[0:42] two', 'Ben'),
        comment('d', '[2:00] three'),
      ],
      200,
    );
    expect(markers.map((m) => [m.seconds, m.count, m.label])).toEqual([
      [40, 2, '0:40 · 2 comments'],
      [120, 1, '2:00 · Aino: three'],
    ]);
  });

  it('falls back to the username and clips long text', () => {
    const [marker] = buildCommentMarkers(
      [{ ...comment('a', `[0:10] ${'x'.repeat(200)}`), authorDisplayName: '' }],
      100,
    );
    expect(marker!.label.startsWith('0:10 · aino: ')).toBe(true);
    expect(marker!.label.endsWith('…')).toBe(true);
  });

  it('returns nothing without a duration', () => {
    expect(buildCommentMarkers([comment('a', '[0:10] hi')], 0)).toEqual([]);
  });
});
