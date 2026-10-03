import { Link } from '@tanstack/react-router';

import { MediaArtwork } from '@tahti-player/ui';

import type { VenueRecording } from '../api/types';
import { formatDuration } from '../lib/playableToTrack';

/** "Recorded here" on a venue page - public tracks whose artist linked this
 * venue. Renders nothing when there are none (or the API predates them). */
export function VenueRecordings({
  recordings,
}: {
  recordings: VenueRecording[] | undefined;
}) {
  if (!recordings || recordings.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="venue-recordings-title"
      className="border-border rounded-xl border p-4"
    >
      <h2
        id="venue-recordings-title"
        className="font-display text-lg font-bold"
      >
        Recorded here
      </h2>
      <ul className="mt-2 flex flex-col gap-1">
        {recordings.map((track) => (
          <li key={track.id}>
            <Link
              to="/t/$id"
              params={{ id: track.id }}
              className="hover:bg-background-secondary -mx-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5"
            >
              <MediaArtwork
                size="thumb"
                src={track.coverUrl}
                alt=""
                placeholder={
                  <span className="text-xs font-bold">
                    {track.title.slice(0, 2).toUpperCase()}
                  </span>
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {track.title}
                </span>
                <span className="text-foreground-secondary block truncate text-xs">
                  {track.artistName}
                </span>
              </span>
              {track.durationSec != null ? (
                <span className="text-foreground-secondary text-xs tabular-nums">
                  {formatDuration(track.durationSec)}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
