import { CalendarClockIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  fetchChannelSchedule,
  type PublicChannelSchedule,
} from '../../api/channel-schedule';
import { Eyebrow } from '../tahti/Eyebrow';

const MAX_VISIBLE = 10;

const startFormat: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
};

export function formatShowDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest} min`;
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function ChannelUpcomingShows({ slug }: { slug: string }) {
  const [schedule, setSchedule] = useState<PublicChannelSchedule | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchChannelSchedule(slug).then((result) => {
      if (!cancelled) {
        setSchedule(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!schedule || schedule.shows.length === 0) {
    return null;
  }

  const notes = schedule.series.filter((series) => series.scheduleNote);

  return (
    <section
      className="border-border flex flex-col gap-3 rounded-lg border px-4 py-3"
      aria-label="Upcoming shows"
    >
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClockIcon size={13} aria-hidden />
          Upcoming shows
        </span>
      </Eyebrow>
      <ul className="flex flex-col gap-2 text-sm">
        {schedule.shows.slice(0, MAX_VISIBLE).map((show) => (
          <li
            key={show.id}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
          >
            <time
              dateTime={show.startAt}
              className="text-foreground-secondary text-xs tabular-nums"
            >
              {new Date(show.startAt).toLocaleString(undefined, startFormat)}
            </time>
            <span className="min-w-0 font-medium">{show.title}</span>
            {show.durationMin ? (
              <span className="text-foreground-secondary text-xs">
                {formatShowDuration(show.durationMin)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {notes.length > 0 ? (
        <ul className="text-foreground-secondary flex flex-col gap-1 text-xs">
          {notes.map((series) => (
            <li key={series.id}>
              <span className="text-foreground font-medium">{series.name}</span>
              {' · '}
              {series.scheduleNote}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
