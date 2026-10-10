import type { ArtistEvent } from '@tahti-web/api/events';
import type { StudioShowSeries } from '@tahti-web/api/shows';

const DAY = 24 * 3600_000;

/**
 * The offline show mocks persist created and edited shows in localStorage,
 * so a story that creates or saves one would leak into the next story.
 */
export function resetStudioShowStorage(): void {
  try {
    localStorage.removeItem('tahti-studio-show-series-v1');
    localStorage.removeItem('tahti-studio-episodes-v1');
  } catch {
    // Storage can be blocked; the seeds still load from memory.
  }
}

export const SINGLE_SHOW: StudioShowSeries = {
  id: 'show-series-demo',
  title: 'Friday Frequency',
  description: 'Weekly deep electronic set, live on Tahti Radio.',
  tagline: 'Deep electronics after dark',
  coverUrl: null,
  showType: 'LIVE_SET',
  mode: 'SINGLE',
  nextEpisodeNumber: 4,
  intervalHours: 2,
  scheduleNote: 'Fridays',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const EVENT_DAYS_FROM_NOW: Record<string, number> = {
  'evt-mock-1': 12,
  'evt-mock-2': 40,
  'evt-mock-3': -20,
  'evt-mock-4': -45,
};

/**
 * `myEvents` override: keeps the first four shared mock events (so Remove,
 * which edits the shared list, still shows) and moves their dates relative
 * to today, because the page splits upcoming from past by the current date.
 */
export function eventsAroundToday(base: ArtistEvent[]): ArtistEvent[] {
  return base.flatMap((event) => {
    const days = EVENT_DAYS_FROM_NOW[event.id];
    return days === undefined
      ? []
      : [
          {
            ...event,
            startAt: new Date(Date.now() + days * DAY).toISOString(),
          },
        ];
  });
}
