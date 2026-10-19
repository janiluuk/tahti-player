import { useId, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  cancelVenueBroadcast,
  createVenueBroadcast,
  type MyVenue,
  type VenueBroadcast,
} from '../../api/venues-manage';
import { ConfirmDialog } from '../ConfirmDialog';

function formatShow(show: VenueBroadcast): string {
  const start = new Date(show.startAt);
  const day = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = start.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!show.endAt) {
    return `${day} ${time}`;
  }
  const end = new Date(show.endAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} ${time}–${end}`;
}

function toIso(local: string): string | null {
  if (!local) {
    return null;
  }
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Upcoming shows at a venue and a form to book one
 * (POST /api/v1/venues/:slug/broadcasts). */
export function VenueShowsSection({
  venue,
  onChanged,
}: {
  venue: MyVenue;
  onChanged: () => void;
}) {
  const headingId = useId();
  const [booking, setBooking] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<VenueBroadcast | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const shows = venue.broadcasts.filter(
    (show) => show.state === 'SCHEDULED' || show.state === 'LIVE',
  );

  const submit = () => {
    const start = toIso(startAt);
    const end = toIso(endAt);
    if (!start) {
      setError('Choose when the show starts.');
      return;
    }
    if (end && end <= start) {
      setError('The show must end after it starts.');
      return;
    }
    setBusy(true);
    setError(null);
    void createVenueBroadcast(venue.slug, {
      startAt: start,
      ...(end ? { endAt: end } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBooking(false);
      setStartAt('');
      setEndAt('');
      setDescription('');
      onChanged();
    });
  };

  const cancelShow = (show: VenueBroadcast) => {
    setCancelling(null);
    setCancelError(null);
    void cancelVenueBroadcast(venue.slug, show.id).then((result) => {
      if (!result.ok) {
        setCancelError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="text-sm font-semibold">
        Upcoming shows
      </h3>
      {shows.length === 0 ? (
        <PageEmpty title="No shows booked here yet." />
      ) : (
        <ul className="divide-border divide-y">
          {shows.map((show) => (
            <li
              key={show.id}
              className="flex items-start justify-between gap-2 py-1.5 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {formatShow(show)}
                  {show.state === 'LIVE' ? ' · Live now' : ''}
                </span>
                {show.description ? (
                  <span className="text-foreground-secondary text-xs">
                    {show.description}
                  </span>
                ) : null}
              </div>
              {show.state === 'SCHEDULED' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Cancel show on ${formatShow(show)}`}
                  onClick={() => setCancelling(show)}
                >
                  Cancel show
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {cancelError ? (
        <p role="alert" className="text-accent-red-strong text-sm">
          {cancelError}
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={cancelling !== null}
        title="Cancel this show?"
        description={
          cancelling
            ? `${formatShow(cancelling)} will be taken off the venue page and its calendar feed.`
            : ''
        }
        confirmLabel="Cancel show"
        cancelLabel="Keep it"
        onCancel={() => setCancelling(null)}
        onConfirm={() => {
          if (cancelling) {
            cancelShow(cancelling);
          }
        }}
      />
      {booking ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            label="Starts"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <Input
            label="Ends (optional)"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
          <Input
            label="What is on (optional)"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error ? (
            <p role="alert" className="text-accent-red-strong text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Booking…' : 'Book the show'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setBooking(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          onClick={() => setBooking(true)}
        >
          Book a show
        </Button>
      )}
    </section>
  );
}
