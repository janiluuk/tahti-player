import { Link } from '@tanstack/react-router';
import { CalendarIcon, MessageCircleIcon, MicIcon } from 'lucide-react';

import { Button, MediaArtwork } from '@tahti-player/ui';

import type { RadioShowUpcomingTrack, StudioShowBooking } from '../api/shows';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { PageEmpty, PageError } from './PageStates';

export function formatUpcoming(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dayDiff = Math.round(
    (new Date(d.toDateString()).getTime() -
      new Date(now.toDateString()).getTime()) /
      86_400_000,
  );
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (dayDiff === 0) {
    return `Today ${time}`;
  }
  if (dayDiff === 1) {
    return `Tomorrow ${time}`;
  }
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
}

const LIST_CLASS =
  'border-border divide-border divide-y overflow-hidden rounded-lg border';

const HEADING_CLASS =
  'text-foreground-secondary text-xs font-semibold tracking-wide uppercase';

/** Radio → Up next: while the station plays its rotation, the rotation
 * tracks coming after the current one; then the booked live shows. */
export function RadioUpNextPanel({
  onRotation,
  rotation,
  rotationError,
  onRetryRotation,
  bookings,
  bookingsError,
  onRetryBookings,
  onBook,
}: {
  onRotation: boolean;
  rotation: RadioShowUpcomingTrack[];
  rotationError?: string;
  onRetryRotation: () => void;
  bookings: StudioShowBooking[];
  bookingsError?: string;
  onRetryBookings: () => void;
  onBook?: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {onRotation ? (
        <section
          className="flex flex-col gap-2"
          data-testid="radio-up-next-rotation"
        >
          <h3 className={HEADING_CLASS}>Next in rotation</h3>
          {rotationError && rotation.length === 0 ? (
            <PageError
              title="Could not load the rotation"
              description={rotationError}
              onRetry={onRetryRotation}
            />
          ) : rotation.length === 0 ? (
            <PageEmpty title="The rotation playlist is empty" />
          ) : (
            <ol className={LIST_CLASS}>
              {rotation.map((track) => (
                <li
                  key={track.id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <MediaArtwork
                    size="sm"
                    src={track.artworkUrl ?? placeholderArtworkUrl(track.id)}
                    alt=""
                    className="shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm leading-6 font-medium">
                      {track.title}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {track.artistUsername ? (
                        <Link
                          to="/u/$username"
                          params={{ username: track.artistUsername }}
                          className="underline-offset-2 hover:underline"
                        >
                          {track.artistName}
                        </Link>
                      ) : (
                        track.artistName
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      <section
        className="flex flex-col gap-2"
        data-testid="radio-up-next-shows"
      >
        <h3 className={HEADING_CLASS}>Booked shows</h3>
        {bookingsError && bookings.length === 0 ? (
          <PageError
            title="Could not load the schedule"
            description={bookingsError}
            onRetry={onRetryBookings}
          />
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <PageEmpty title="Nothing booked yet — fair rotation plays when nobody is." />
            {onBook ? (
              <Button size="sm" variant="secondary" onClick={onBook}>
                <CalendarIcon size={15} className="mr-1.5" aria-hidden />
                Book a slot
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className={LIST_CLASS}>
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2">
                {b.showType === 'TALK' ? (
                  <MessageCircleIcon
                    size={16}
                    aria-hidden
                    className="text-foreground-secondary shrink-0"
                  />
                ) : (
                  <MicIcon
                    size={16}
                    aria-hidden
                    className="text-foreground-secondary shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    to="/radio/show/$channelSlug"
                    params={{ channelSlug: b.channelSlug }}
                    className="block truncate text-sm leading-6 font-medium underline-offset-2 hover:underline"
                  >
                    {b.note ?? b.displayName}
                  </Link>
                  <div className="text-foreground-secondary truncate text-xs">
                    {b.displayName}
                    {b.isMine ? ' (you)' : ''}
                  </div>
                </div>
                <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                  {formatUpcoming(b.startAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
