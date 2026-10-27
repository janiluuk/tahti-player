import { describe, expect, it } from 'vitest';

import { formatTracklist, latestSession } from './setTracklist';

const entry = (id: number, playedAt: string, title: string, artist = 'DJ') => ({
  id,
  trackId: null,
  title,
  artist,
  playedAt,
});

describe('latestSession', () => {
  it('keeps the newest run of listens without a long break, oldest first', () => {
    const session = latestSession([
      entry(4, '2026-10-27 22:40:00', 'Four'),
      entry(3, '2026-10-27 22:05:00', 'Three'),
      entry(2, '2026-10-27 21:50:00', 'Two'),
      entry(1, '2026-10-27 18:00:00', 'One'),
    ]);
    expect(session.map((item) => item.title)).toEqual(['Two', 'Three', 'Four']);
  });

  it('is empty without history', () => {
    expect(latestSession([])).toEqual([]);
  });
});

describe('formatTracklist', () => {
  it('numbers each track with its start time', () => {
    expect(
      formatTracklist(
        [
          entry(1, '2026-10-27 21:50:00', 'Two'),
          entry(2, '2026-10-27 22:05:00', 'Three', ''),
        ],
        'UTC',
      ),
    ).toBe('01. 21:50 DJ – Two\n02. 22:05 Three');
  });
});
