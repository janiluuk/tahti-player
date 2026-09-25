import { describe, expect, it } from 'vitest';

import type { HistoryEntry } from '../stores/libraryStore';
import { dailyListeningMs } from './historyStats';

function entry(playedAt: string): HistoryEntry {
  return {
    playedAt,
    playable: {
      id: `track-${playedAt}`,
      kind: 'track',
      title: 'Track',
      artist: 'Artist',
      streamUrl: 'https://example.com/a.mp3',
    },
  } as HistoryEntry;
}

describe('dailyListeningMs', () => {
  const now = new Date('2026-09-25T12:00:00Z');

  it('pads an empty history to a 12-month window', () => {
    expect(dailyListeningMs([], now)).toEqual([
      { date: '2025-09-25', value: 0 },
      { date: '2026-09-25', value: 0 },
    ]);
  });

  it('keeps played days between the padded endpoints and drops older ones', () => {
    const days = dailyListeningMs(
      [entry('2026-09-20T10:00:00Z'), entry('2024-01-01T10:00:00Z')],
      now,
    );
    expect(days.map((d) => d.date)).toEqual([
      '2025-09-25',
      '2026-09-20',
      '2026-09-25',
    ]);
    expect(days[1]!.value).toBeGreaterThan(0);
  });
});
