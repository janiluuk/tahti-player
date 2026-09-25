import { CalendarIcon } from 'lucide-react';

import { ButtonLink } from '@tahti-player/ui';

import { Group } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

export function UpcomingShowsSection({ state }: { state: StudioHomeState }) {
  const { upcomingShows } = state;

  if (upcomingShows.length === 0) {
    return null;
  }

  return (
    <Group title="Upcoming shows">
      <ul className="border-border divide-border divide-y rounded-xl border">
        {upcomingShows.map((show) => (
          <li
            key={show.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3"
          >
            <span className="bg-accent-blue/15 text-accent-blue flex size-10 shrink-0 items-center justify-center rounded-lg">
              <CalendarIcon size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {show.title}
                {show.episodeNumber != null
                  ? ` · Episode ${show.episodeNumber}`
                  : ''}
              </p>
              <p className="text-foreground-secondary text-xs">
                {new Date(show.startAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {show.venue ? ` · ${show.venue}` : ''}
              </p>
            </div>
            <ButtonLink
              to="/studio/shows/$id"
              params={{ id: show.seriesId }}
              size="sm"
              variant="secondary"
            >
              View &amp; edit
            </ButtonLink>
          </li>
        ))}
      </ul>
    </Group>
  );
}
