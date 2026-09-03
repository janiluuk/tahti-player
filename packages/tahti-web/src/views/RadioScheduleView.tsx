import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  MicIcon,
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';

import { Button, Dialog, Input, SaveButton, Tabs } from '@tahti-player/ui';

import {
  cancelShowBooking,
  createShowBooking,
  fetchShowBookings,
  SHOW_SLOT_MAX_HOURS,
  updateShowBooking,
  type ShowType,
  type StudioShowBooking,
} from '../api/shows';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { cn } from '../lib/cn';
import {
  addDays,
  atHour,
  buildBookingGrid,
  filterBookingsForStation,
  isGreenRoomWindow,
  nextSelectionOnCellClick,
  SCHEDULE_HOURS,
  selectionRange,
  startOfLocalDay,
  weekDays,
  weekLabel,
  weekRangeIso,
  type ScheduleSelection,
  type StationFilter,
} from '../lib/radioSchedule';
import { useAuthStore } from '../stores/authStore';
import { useChannelSetupModalStore } from '../stores/channelSetupModalStore';

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function bookingTitle(booking: StudioShowBooking): string {
  return (
    booking.note || (booking.showType === 'TALK' ? 'Talk show' : 'Live set')
  );
}

export function RadioScheduleView() {
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const ownChannelSlug = user?.channel?.slug ?? null;

  const [station, setStation] = useState<StationFilter>('radio');
  const search = useSearch({ strict: false }) as { station?: StationFilter };
  const navigate = useNavigate({ from: '/schedule' });
  const [weekStart, setWeekStart] = useState(() => startOfLocalDay(new Date()));
  const [bookings, setBookings] = useState<StudioShowBooking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<StudioShowBooking[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<ScheduleSelection | null>(null);
  const [note, setNote] = useState('');
  const [showType, setShowType] = useState<ShowType>('LIVE_SET');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<StudioShowBooking | null>(null);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editShowType, setEditShowType] = useState<ShowType>('LIVE_SET');

  useEffect(() => {
    const nextStation = search.station ?? (ownChannelSlug ? 'mine' : 'radio');
    setStation(nextStation === 'mine' && ownChannelSlug ? 'mine' : 'radio');
  }, [ownChannelSlug, search.station]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);

  useEffect(() => {
    setLoading(true);
    setSelection(null);
    setError(null);
    setMessage(null);
    const { from, to } = weekRangeIso(weekStart);
    let cancelled = false;
    void fetchShowBookings(from, to).then((r) => {
      if (cancelled) {
        return;
      }
      setBookings(r.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  useEffect(() => {
    if (!ownChannelSlug) {
      setUpcomingBookings([]);
      return;
    }
    const from = new Date();
    const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    let cancelled = false;
    void fetchShowBookings(from.toISOString(), to.toISOString()).then(
      (result) => {
        if (cancelled) {
          return;
        }
        setUpcomingBookings(
          result.data
            .filter(
              (booking) =>
                booking.channelSlug === ownChannelSlug || booking.isMine,
            )
            .filter((booking) => new Date(booking.endAt).getTime() > Date.now())
            .sort((left, right) => left.startAt.localeCompare(right.startAt)),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [ownChannelSlug]);

  function changeStation(nextStation: StationFilter) {
    setStation(nextStation);
    void navigate({
      search: (previous) => ({ ...previous, station: nextStation }),
      replace: true,
    });
  }

  const stationTabs: StationFilter[] = ownChannelSlug
    ? ['radio', 'mine']
    : ['radio'];

  const visibleBookings = useMemo(
    () => filterBookingsForStation(bookings, station, ownChannelSlug),
    [bookings, station, ownChannelSlug],
  );

  const grid = useMemo(
    () => buildBookingGrid(days, visibleBookings),
    [days, visibleBookings],
  );

  // Bookings imminent, live, or just wrapped up — surfaced as a direct link
  // into that artist's green room rather than making a viewer hunt for it on
  // the artist's page.
  const greenRoomBookings = useMemo(
    () => visibleBookings.filter((b) => isGreenRoomWindow(b)),
    [visibleBookings],
  );

  function bookingAt(day: Date, hour: number): StudioShowBooking | undefined {
    return grid.get(`${day.toDateString()}-${hour}`);
  }

  function cancelBooking(id: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    void cancelShowBooking(id).then((res) => {
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setMessage('Booking cancelled.');
      setSelectedBooking(null);
      setCancelConfirming(false);
    });
  }

  function saveBookingEdits() {
    if (!selectedBooking) {
      return;
    }
    setError(null);
    setBusy(true);
    void updateShowBooking(selectedBooking.id, {
      note: editNote.trim() || null,
      showType: editShowType,
    }).then((res) => {
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === res.data.id ? res.data : b)),
      );
      setSelectedBooking(res.data);
      setMessage('Booking updated.');
    });
  }

  function onCellClick(day: Date, hour: number) {
    const existing = bookingAt(day, hour);
    if (existing) {
      if (existing.isMine) {
        setSelectedBooking(existing);
        setEditNote(existing.note ?? '');
        setEditShowType(existing.showType);
      }
      return;
    }
    if (!ownChannelSlug) {
      return;
    }
    if (atHour(day, hour).getTime() <= Date.now()) {
      return;
    }
    setError(null);
    setMessage(null);
    setSelection((current) =>
      nextSelectionOnCellClick(current, day, hour, SHOW_SLOT_MAX_HOURS),
    );
  }

  function extendSelection() {
    if (!selection || selection.hours >= SHOW_SLOT_MAX_HOURS) {
      return;
    }
    const nextHour = selection.startHour + selection.hours;
    if (nextHour > 23 || bookingAt(selection.day, nextHour)) {
      return;
    }
    setSelection({ ...selection, hours: (selection.hours + 1) as 1 | 2 });
  }

  function confirmBooking() {
    if (!selection) {
      return;
    }
    setError(null);
    setBusy(true);
    const { startAt, endAt } = selectionRange(selection);
    void createShowBooking({
      startAt,
      endAt,
      note: note.trim() || undefined,
      showType,
    }).then((res) => {
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBookings((prev) => [...prev, res.data]);
      setSelection(null);
      setNote('');
      setShowType('LIVE_SET');
      setMessage('Slot booked.');
    });
  }

  return (
    <PageFrame maxWidth="5xl">
      <PageHeader
        title="Schedule"
        subtitle="A week at a glance on Tahti Radio — book an open hour to play a live set, or switch to your own channel to see just your slots."
      />

      {greenRoomBookings.length > 0 ? (
        <div className="border-border bg-primary/10 flex flex-col gap-2 rounded-lg border p-3">
          {greenRoomBookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>
                <strong>{bookingTitle(b)}</strong> by {b.displayName} —{' '}
                {new Date(b.startAt).getTime() <= Date.now()
                  ? 'live now'
                  : 'starting soon'}
              </span>
              <Link
                to="/u/$username/green-room"
                params={{ username: b.username }}
              >
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label={`Open ${b.displayName}'s green room`}
                  title="Green room"
                >
                  <MicIcon size={16} aria-hidden />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {ownChannelSlug ? (
          <aside className="border-border bg-background-secondary/30 shrink-0 rounded-xl border p-4 lg:w-64">
            <div className="text-foreground-secondary mb-3 font-mono text-xs tracking-wider uppercase">
              Your next two weeks
            </div>
            {upcomingBookings.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No upcoming shows booked.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcomingBookings.map((booking) => (
                  <li key={booking.id}>
                    <button
                      type="button"
                      className="hover:bg-background-secondary w-full rounded-md p-2 text-left text-sm transition-colors"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setEditNote(booking.note ?? '');
                        setEditShowType(booking.showType);
                      }}
                    >
                      <span className="block truncate font-semibold">
                        {bookingTitle(booking)}
                      </span>
                      <span className="text-foreground-secondary block text-xs">
                        {new Date(booking.startAt).toLocaleDateString(
                          undefined,
                          {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}{' '}
                        {formatHour(new Date(booking.startAt).getHours())}
                      </span>
                      <span className="text-foreground-secondary block truncate text-xs">
                        {booking.channelSlug}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Tabs.Root
              selectedIndex={Math.max(0, stationTabs.indexOf(station))}
              onChange={(index) => {
                const next = stationTabs[index];
                if (next) {
                  changeStation(next);
                }
              }}
            >
              <Tabs.List className="w-fit">
                {stationTabs.map((item) => (
                  <Tabs.Tab key={item}>
                    {item === 'radio' ? 'Tahti Radio' : 'My channel'}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.Root>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Previous week"
                disabled={busy}
                onClick={() => setWeekStart((w) => addDays(w, -7))}
              >
                <ChevronLeftIcon size={16} aria-hidden />
              </Button>
              <span className="text-sm font-semibold tabular-nums">
                {weekLabel(days)}
              </span>
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Next week"
                disabled={busy}
                onClick={() => setWeekStart((w) => addDays(w, 7))}
              >
                <ChevronRightIcon size={16} aria-hidden />
              </Button>
              {weekStart.toDateString() !==
              startOfLocalDay(new Date()).toDateString() ? (
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setWeekStart(startOfLocalDay(new Date()))}
                >
                  This week
                </Button>
              ) : null}
            </div>
          </div>

          <div className="border-border overflow-x-auto rounded-xl border">
            <div className="grid min-w-[46.5rem] grid-cols-[4.5rem_repeat(7,minmax(6rem,1fr))]">
              <div className="border-border bg-background-secondary/40 border-r border-b" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-border bg-background-secondary/40 flex flex-col items-center border-b px-2 py-2 text-xs"
                >
                  <span className="font-semibold">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <span className="text-foreground-secondary">
                    {day.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}

              {SCHEDULE_HOURS.map((hour) => (
                <Fragment key={hour}>
                  <div className="border-border text-foreground-secondary flex items-center justify-end border-r px-2 py-1.5 text-xs tabular-nums">
                    {formatHour(hour)}
                  </div>
                  {days.map((day) => {
                    const cellStart = atHour(day, hour);
                    const isPast = cellStart.getTime() <= Date.now();
                    const booking = bookingAt(day, hour);
                    const isSelected = Boolean(
                      selection &&
                      selection.day.toDateString() === day.toDateString() &&
                      hour >= selection.startHour &&
                      hour < selection.startHour + selection.hours,
                    );
                    return (
                      <button
                        key={`${day.toISOString()}-${hour}`}
                        type="button"
                        disabled={loading || (isPast && !booking?.isMine)}
                        onClick={() => onCellClick(day, hour)}
                        aria-label={
                          booking
                            ? `${bookingTitle(booking)} by ${booking.displayName}${
                                booking.isMine ? ' — click to view' : ''
                              }`
                            : `${day.toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })} at ${formatHour(hour)}${
                                isPast ? ' — unavailable' : ' — available'
                              }`
                        }
                        className={cn(
                          'border-border h-8 border-r border-b px-1.5 text-left text-[11px] transition-colors',
                          booking
                            ? booking.isMine
                              ? 'bg-primary/20 text-primary hover:bg-primary/30'
                              : 'bg-background-secondary text-foreground-secondary cursor-default'
                            : isPast
                              ? 'bg-background-secondary/20 cursor-not-allowed'
                              : 'hover:bg-background-secondary',
                          isSelected && 'ring-primary ring-2 ring-inset',
                        )}
                      >
                        {booking ? (
                          <span className="flex items-center gap-1 truncate">
                            {booking.showType === 'TALK' ? (
                              <MessageCircleIcon
                                size={11}
                                aria-hidden
                                className="shrink-0"
                              />
                            ) : (
                              <MicIcon
                                size={11}
                                aria-hidden
                                className="shrink-0"
                              />
                            )}
                            <span className="truncate">
                              {booking.displayName}
                            </span>
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selection ? (
        <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <div className="text-sm">
            <strong>
              {selection.day.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {', '}
              {formatHour(selection.startHour)}–
              {formatHour(selection.startHour + selection.hours)}
            </strong>
            <span className="text-foreground-secondary">
              {' '}
              ({selection.hours}h)
            </span>
          </div>
          {selection.hours < SHOW_SLOT_MAX_HOURS ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={extendSelection}
            >
              +1 hour
            </Button>
          ) : null}
          <div
            className="border-border flex gap-1 rounded-lg border p-1"
            role="radiogroup"
            aria-label="Show type"
          >
            {(
              [
                ['LIVE_SET', 'Live set'],
                ['TALK', 'Talk'],
              ] as const
            ).map(([type, label]) => (
              <Button
                key={type}
                type="button"
                variant="text"
                size="flexible"
                onClick={() => setShowType(type)}
                aria-pressed={showType === type}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold uppercase',
                  showType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-secondary hover:text-foreground',
                )}
              >
                {label}
              </Button>
            ))}
          </div>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              showType === 'TALK'
                ? 'Note (optional) — topic or guests'
                : "Note (optional) — what you're playing"
            }
            className="min-w-0 flex-1 sm:min-w-48"
          />
          <Button size="sm" disabled={busy} onClick={confirmBooking}>
            {busy ? 'Booking…' : 'Confirm booking'}
          </Button>
          <Button
            size="sm"
            variant="text"
            disabled={busy}
            onClick={() => setSelection(null)}
          >
            Cancel
          </Button>
        </div>
      ) : !user ? (
        <p className="text-foreground-secondary text-sm">
          <Link
            to="/login"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Sign in
          </Link>{' '}
          to book a slot on Tahti Radio.
        </p>
      ) : !ownChannelSlug ? (
        <p className="text-foreground-secondary text-sm">
          <Button
            type="button"
            variant="text"
            size="flexible"
            onClick={openChannelSetup}
            className="text-foreground p-0 underline-offset-2 hover:underline"
          >
            Set up a channel
          </Button>{' '}
          to book a slot on Tahti Radio.
        </p>
      ) : (
        <p className="text-foreground-secondary text-sm">
          Click an open hour above to start a booking — click one of your own
          slots to view or cancel it.
        </p>
      )}

      {message ? (
        <p className="text-sm" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-accent-red text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="text-foreground-secondary flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <i className="bg-primary/20 inline-block size-2.5 rounded-sm" />
          Your bookings (click to view)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="bg-background-secondary inline-block size-2.5 rounded-sm" />
          Booked by others
        </span>
      </div>

      <Dialog.Root
        isOpen={Boolean(selectedBooking)}
        onClose={() => {
          if (!busy) {
            setSelectedBooking(null);
            setCancelConfirming(false);
          }
        }}
      >
        {selectedBooking &&
          (cancelConfirming ? (
            <>
              <Dialog.Title>Cancel this booking?</Dialog.Title>
              <Dialog.Description>
                This removes your{' '}
                {formatHour(new Date(selectedBooking.startAt).getHours())} slot
                on{' '}
                {new Date(selectedBooking.startAt).toLocaleDateString(
                  undefined,
                  { weekday: 'long', month: 'long', day: 'numeric' },
                )}
                . This can't be undone.
              </Dialog.Description>
              <Dialog.Actions>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setCancelConfirming(false)}
                >
                  Keep booking
                </Button>
                <Button
                  intent="danger"
                  disabled={busy}
                  onClick={() => cancelBooking(selectedBooking.id)}
                >
                  {busy ? 'Cancelling…' : 'Cancel booking'}
                </Button>
              </Dialog.Actions>
            </>
          ) : (
            <>
              <Dialog.Title>{bookingTitle(selectedBooking)}</Dialog.Title>
              <Dialog.Description>
                {new Date(selectedBooking.startAt).toLocaleDateString(
                  undefined,
                  { weekday: 'long', month: 'long', day: 'numeric' },
                )}
                , {formatHour(new Date(selectedBooking.startAt).getHours())}–
                {formatHour(new Date(selectedBooking.endAt).getHours())}
              </Dialog.Description>
              <div className="flex flex-col gap-3">
                {selectedBooking.showTitle && (
                  <p className="text-sm">
                    <span className="text-foreground-secondary">Show: </span>
                    {selectedBooking.showTitle}
                    {selectedBooking.episodeNumber != null
                      ? ` — Episode #${selectedBooking.episodeNumber}`
                      : ''}
                  </p>
                )}
                <div
                  className="border-border flex w-fit gap-1 rounded-lg border p-1"
                  role="radiogroup"
                  aria-label="Show type"
                >
                  {(
                    [
                      ['LIVE_SET', 'Live set'],
                      ['TALK', 'Talk'],
                    ] as const
                  ).map(([type, label]) => (
                    <Button
                      key={type}
                      type="button"
                      variant="text"
                      size="flexible"
                      onClick={() => setEditShowType(type)}
                      aria-pressed={editShowType === type}
                      disabled={busy}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold uppercase',
                        editShowType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground-secondary hover:text-foreground',
                      )}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <Input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  disabled={busy}
                  placeholder={
                    editShowType === 'TALK'
                      ? 'Note — topic or guests'
                      : "Note — what you're playing"
                  }
                />
              </div>
              <Dialog.Actions>
                <Dialog.Close>Close</Dialog.Close>
                <Button
                  intent="danger"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setCancelConfirming(true)}
                >
                  Cancel booking
                </Button>
                <SaveButton
                  disabled={busy}
                  saving={busy}
                  label="Save changes"
                  onClick={saveBookingEdits}
                />
              </Dialog.Actions>
            </>
          ))}
      </Dialog.Root>
    </PageFrame>
  );
}
