import type { ArtistEvent } from '../api/events';
import type { ListeningPartySummaryDto } from '../api/listening-parties';
import type { ScheduledShow } from '../api/shows/types';

export type AgendaKind = 'show' | 'event' | 'party';

export type AgendaItem = {
  id: string;
  kind: AgendaKind;
  title: string;
  startAt: string;
  place?: string;
  live?: boolean;
  to: string;
  params?: Record<string, string>;
};

const timeOf = (iso: string) => {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
};

/** Upcoming shows, events and listening parties in one list, soonest
 * first. A party that is live now stays on it. */
export function buildBroadcastAgenda(
  {
    shows = [],
    events = [],
    parties = [],
  }: {
    shows?: ScheduledShow[];
    events?: ArtistEvent[];
    parties?: ListeningPartySummaryDto[];
  },
  now = Date.now(),
): AgendaItem[] {
  const items: AgendaItem[] = [
    ...shows
      .filter((show) => timeOf(show.startAt) > now)
      .map((show) => ({
        id: `show:${show.id}`,
        kind: 'show' as const,
        title: show.title,
        startAt: show.startAt,
        place: show.venue ?? show.location ?? undefined,
        to: '/studio/shows/$id',
        params: { id: show.seriesId },
      })),
    ...events
      .filter((event) => timeOf(event.startAt) > now)
      .map((event) => ({
        id: `event:${event.id}`,
        kind: 'event' as const,
        title: event.title,
        startAt: event.startAt,
        place:
          [event.place, event.location].filter(Boolean).join(', ') || undefined,
        to: '/studio/events/$eventId',
        params: { eventId: event.id },
      })),
    ...parties
      .filter(
        (party) =>
          party.state === 'LIVE' ||
          (party.state === 'SCHEDULED' && timeOf(party.startAt) > now),
      )
      .map((party) => ({
        id: `party:${party.id}`,
        kind: 'party' as const,
        title: party.release.title,
        startAt: party.startAt,
        live: party.state === 'LIVE',
        to: '/party/$id',
        params: { id: party.id },
      })),
  ];
  return items.sort((left, right) => {
    if (left.live !== right.live) {
      return left.live ? -1 : 1;
    }
    return timeOf(left.startAt) - timeOf(right.startAt);
  });
}
