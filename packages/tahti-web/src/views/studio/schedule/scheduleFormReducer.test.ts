import { describe, expect, it } from 'vitest';

import type { StudioShowSeries } from '../../../api/shows';
import {
  initialScheduleFormState,
  scheduleFormReducer,
} from './scheduleFormReducer';

const series = (overrides: Partial<StudioShowSeries>): StudioShowSeries => ({
  id: 'show-a',
  title: 'Friday Frequency',
  description: 'Weekly',
  coverUrl: null,
  showType: 'LIVE_SET',
  nextEpisodeNumber: 3,
  intervalHours: 2,
  scheduleNote: null,
  createdAt: '2030-01-01T00:00:00.000Z',
  ...overrides,
});

describe('scheduleFormReducer', () => {
  it('sets one field and leaves the rest alone', () => {
    const next = scheduleFormReducer(initialScheduleFormState, {
      type: 'set',
      key: 'venue',
      value: 'Club',
    });

    expect(next.venue).toBe('Club');
    expect({ ...next, venue: '' }).toEqual(initialScheduleFormState);
  });

  it('keeps an unknown show id selected without touching the fields', () => {
    const next = scheduleFormReducer(
      { ...initialScheduleFormState, note: 'Typed name' },
      { type: 'showPicked', showId: 'missing' },
    );

    expect(next.selectedShowId).toBe('missing');
    expect(next.note).toBe('Typed name');
  });

  it('falls back to a whole-hour remainder when a show has no recurrence length', () => {
    const next = scheduleFormReducer(
      { ...initialScheduleFormState, shows: [series({})] },
      { type: 'showPicked', showId: 'show-a' },
    );

    expect(next.durationHours).toBe(2);
    expect(next.durationMinutes).toBe(0);
  });

  it('matches the next broadcast to a show by title when it has no show id', () => {
    const next = scheduleFormReducer(
      {
        ...initialScheduleFormState,
        shows: [series({ id: 'show-b', title: 'Talk Night' })],
        schedule: {
          nextBroadcastAt: '2030-01-05T18:30:00.000Z',
          nextBroadcastNote: 'Talk Night',
        },
      },
      { type: 'editorOpened' },
    );

    expect(next.selectedShowId).toBe('show-b');
    expect(next.editorOpen).toBe(true);
  });

  it('replaces an updated show in place', () => {
    const next = scheduleFormReducer(
      {
        ...initialScheduleFormState,
        shows: [series({ id: 'one' }), series({ id: 'two' })],
      },
      { type: 'showUpdated', show: series({ id: 'two', title: 'Renamed' }) },
    );

    expect(next.shows.map((show) => show.title)).toEqual([
      'Friday Frequency',
      'Renamed',
    ]);
  });
});
