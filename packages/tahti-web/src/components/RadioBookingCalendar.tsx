import { Link, useNavigate } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  MicIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  ButtonLink,
  Dialog,
  ImageReveal,
  Input,
  Tooltip,
} from '@tahti-player/ui';

import {
  createEpisode,
  createShowBooking,
  createShowSeries,
  fetchShowBookings,
  fetchShowSeries,
  type ShowType,
  type StudioShowBooking,
  type StudioShowSeries,
} from '../api/shows';
import { useAuthStore } from '../stores/authStore';
import {
  BroadcastDetailsFields,
  type BroadcastDetailsValues,
} from './BroadcastDetailsFields';
import { PageLoading } from './PageStates';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Monday-first 6-week grid covering the given month. */
function monthGridDays(monthCursor: Date): Date[] {
  const first = startOfMonth(monthCursor);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function combineDateAndTime(date: Date, timeHHMM: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeHHMM);
  if (!match) {
    return null;
  }
  const d = new Date(date);
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

function formatTimeRange(startAt: string, endAt: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  return `${fmt(startAt)}–${fmt(endAt)}`;
}

export function RadioBookingCalendar({
  isOpen,
  onClose,
  onBooked,
  scope = 'all',
}: {
  isOpen: boolean;
  onClose: () => void;
  onBooked?: () => void;
  scope?: 'all' | 'mine';
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [monthCursor, setMonthCursor] = useState(() =>
    startOfMonth(new Date()),
  );
  const [bookings, setBookings] = useState<StudioShowBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [startTime, setStartTime] = useState('20:00');
  const [durationHours, setDurationHours] = useState<1 | 2>(1);
  const [note, setNote] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [showCoverUrl, setShowCoverUrl] = useState('');
  const [newShowMode, setNewShowMode] = useState<'SINGLE' | 'SERIES'>('SERIES');
  const [showType, setShowType] = useState<ShowType>('LIVE_SET');
  const [shows, setShows] = useState<StudioShowSeries[]>([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<StudioShowBooking | null>(null);

  const days = useMemo(() => monthGridDays(monthCursor), [monthCursor]);

  const reload = () => {
    setLoading(true);
    const from = days[0]!.toISOString();
    const to = new Date(
      days[days.length - 1]!.getTime() + 24 * 3600_000,
    ).toISOString();
    void fetchShowBookings(from, to).then((r) => {
      setBookings(scope === 'mine' ? r.data.filter((b) => b.isMine) : r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (isOpen) {
      reload();
      if (user?.channel) {
        void fetchShowSeries().then((result) => setShows(result.data));
      }
    }
  }, [isOpen, monthCursor, scope, user?.channel]);

  const selectShow = (showId: string) => {
    setSelectedShowId(showId);
    const show = shows.find((candidate) => candidate.id === showId);
    if (!show) {
      setShowDescription('');
      setShowCoverUrl('');
      setNewShowMode('SERIES');
      return;
    }
    setShowType(show.showType);
    setDurationHours(show.intervalHours);
    setNote(show.title);
    setShowDescription(show.description);
    setShowCoverUrl(show.coverUrl ?? '');
    setNewShowMode(show.mode ?? 'SERIES');
  };

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, StudioShowBooking[]>();
    for (const b of bookings) {
      const key = new Date(b.startAt).toDateString();
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startAt.localeCompare(b.startAt));
    }
    return map;
  }, [bookings]);

  const today = new Date();
  const selectedKey = selectedDate.toDateString();
  const selectedBookings = bookingsByDay.get(selectedKey) ?? [];
  const endOfSelectedDay = new Date(selectedDate);
  endOfSelectedDay.setHours(23, 59, 59, 999);
  const isPastDay = endOfSelectedDay.getTime() < Date.now();

  const book = async () => {
    setMsg(null);
    const start = combineDateAndTime(selectedDate, startTime);
    if (!start) {
      setMsg('Enter a valid start time.');
      return;
    }
    const end = new Date(start.getTime() + durationHours * 3600_000);
    setBusy(true);
    let selectedShow = shows.find((show) => show.id === selectedShowId);
    if (!selectedShow) {
      if (!note.trim()) {
        setBusy(false);
        setMsg('Enter a show name to create a new show.');
        return;
      }
      const created = await createShowSeries({
        title: note.trim(),
        description: showDescription.trim(),
        coverUrl: showCoverUrl.trim() || null,
        mode: newShowMode,
        showType,
        intervalHours: durationHours,
      });
      if (!created.ok) {
        setBusy(false);
        setMsg(created.error);
        return;
      }
      selectedShow = created.data;
      setShows((current) => [created.data, ...current]);
    }
    const r = await createShowBooking({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      note: selectedShow.title,
      showType: selectedShow.showType,
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    if (selectedShow) {
      const episode = await createEpisode({
        showId: selectedShow.id,
        source: 'broadcast',
        slotStartAt: r.data.startAt,
        slotEndAt: r.data.endAt,
        bookingId: r.data.id,
      });
      if (!episode.ok) {
        setMsg(
          `Slot booked, but the show episode could not be prepared: ${episode.error}`,
        );
        reload();
        onBooked?.();
        return;
      }
      setNote('');
      setShowDescription('');
      setShowCoverUrl('');
      setSelectedShowId('');
      reload();
      onBooked?.();
      setBookingFormOpen(false);
      onClose();
      void navigate({
        to: '/studio/shows/episodes/$episodeId',
        params: { episodeId: episode.data.id },
      });
      return;
    }
    setNote('');
    setMsg(
      `Booked ${durationHours}h — ${start.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}.`,
    );
    reload();
    onBooked?.();
  };

  return (
    <>
      <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-2xl">
        <div className="flex items-center gap-2 pr-8">
          <Dialog.Title>
            {scope === 'mine' ? 'My channel schedule' : 'Tahti Radio schedule'}
          </Dialog.Title>
          <Tooltip content="Open full calendar" side="top">
            <ButtonLink
              to="/schedule"
              onClick={onClose}
              size="icon-sm"
              variant="text"
              aria-label="Open full calendar"
            >
              <CalendarDaysIcon size={16} aria-hidden />
            </ButtonLink>
          </Tooltip>
        </div>
        <Dialog.Description>
          {scope === 'mine'
            ? 'Your booked slots and shows on Tahti Radio.'
            : 'Community slot calendar — book time to broadcast on Tahti Radio.'}
        </Dialog.Description>

        <div className="mt-4 flex items-center justify-between">
          <Tooltip content="Previous month" side="top">
            <Button
              size="icon-sm"
              variant="text"
              aria-label="Previous month"
              onClick={() =>
                setMonthCursor(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeftIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
          <div className="text-sm font-semibold">
            {monthCursor.toLocaleDateString([], {
              month: 'long',
              year: 'numeric',
            })}
          </div>
          {user && (
            <Tooltip content="Book a slot" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Book a slot"
                onClick={() => setBookingFormOpen(true)}
              >
                <CalendarPlusIcon size={15} aria-hidden />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Next month" side="top">
            <Button
              size="icon-sm"
              variant="text"
              aria-label="Next month"
              onClick={() =>
                setMonthCursor(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRightIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-foreground-secondary py-1 text-center text-[11px] font-semibold tracking-wide uppercase"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = day.getMonth() === monthCursor.getMonth();
            const dayBookings = bookingsByDay.get(day.toDateString()) ?? [];
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center gap-1 rounded-md py-1.5 text-sm ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : inMonth
                      ? 'hover:bg-background-secondary'
                      : 'text-foreground-secondary hover:bg-background-secondary opacity-40'
                } ${isToday && !isSelected ? 'ring-primary ring-1' : ''}`}
              >
                <span className="tabular-nums">{day.getDate()}</span>
                <span
                  className={`h-1 w-1 rounded-full ${
                    dayBookings.length > 0
                      ? isSelected
                        ? 'bg-background'
                        : 'bg-primary'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="border-border mt-4 flex flex-col gap-3 border-t pt-3">
          <div className="text-sm font-semibold">
            {selectedDate.toLocaleDateString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {loading ? (
            <PageLoading label="Loading…" />
          ) : selectedBookings.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No slots booked yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {selectedBookings.map((b) => (
                <li
                  key={b.id}
                  className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                >
                  {b.showType === 'TALK' ? (
                    <MessageCircleIcon
                      size={14}
                      aria-hidden
                      className="text-foreground-secondary shrink-0"
                    />
                  ) : (
                    <MicIcon
                      size={14}
                      aria-hidden
                      className="text-foreground-secondary shrink-0"
                    />
                  )}
                  <span className="text-foreground-secondary shrink-0 tabular-nums">
                    {formatTimeRange(b.startAt, b.endAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="min-w-0 flex-1 truncate text-left font-medium hover:underline"
                  >
                    {b.showTitle ?? b.note ?? b.displayName}
                    {b.episodeNumber != null
                      ? ` · Episode ${b.episodeNumber}`
                      : ''}
                    {b.isMine ? ' (you)' : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!user ? (
            <p className="text-foreground-secondary text-sm">
              <Link
                to="/login"
                onClick={onClose}
                className="text-foreground underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{' '}
              to book a slot.
            </p>
          ) : isPastDay ? (
            <p className="text-foreground-secondary text-sm">
              Pick a day from today onward to book.
            </p>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setBookingFormOpen(true)}
            >
              <CalendarPlusIcon size={15} aria-hidden className="mr-1.5" />
              Book a slot
            </Button>
          )}

          {msg && (
            <p className="text-sm" role="status">
              {msg}
            </p>
          )}
        </div>

        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>

      <Dialog.Root
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        className="max-w-xl"
      >
        {selectedBooking ? (
          <>
            {selectedBooking.coverUrl ? (
              <div className="border-border bg-background-secondary relative -mx-6 -mt-6 mb-5 h-40 overflow-hidden border-b">
                <ImageReveal
                  src={selectedBooking.coverUrl}
                  alt=""
                  className="h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            ) : null}
            <Dialog.Title>
              {selectedBooking.showTitle ??
                selectedBooking.note ??
                selectedBooking.displayName}
            </Dialog.Title>
            <Dialog.Description>
              {selectedBooking.displayName}
              {selectedBooking.episodeNumber != null
                ? ` · Episode ${selectedBooking.episodeNumber}`
                : ''}
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <div>
                <span className="text-foreground-secondary block text-xs uppercase">
                  When
                </span>
                {new Date(selectedBooking.startAt).toLocaleDateString([], {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                {formatTimeRange(
                  selectedBooking.startAt,
                  selectedBooking.endAt,
                )}
              </div>
              {selectedBooking.showDescription ? (
                <p className="text-foreground-secondary leading-relaxed">
                  {selectedBooking.showDescription}
                </p>
              ) : null}
            </div>
            <Dialog.Actions>
              {selectedBooking.isMine && selectedBooking.showId ? (
                <ButtonLink
                  to="/studio/shows/$id"
                  params={{ id: selectedBooking.showId }}
                  onClick={() => {
                    setSelectedBooking(null);
                    onClose();
                  }}
                  variant="secondary"
                >
                  Edit show
                </ButtonLink>
              ) : (
                <ButtonLink
                  to="/radio/show/$channelSlug"
                  params={{ channelSlug: selectedBooking.channelSlug }}
                  onClick={() => {
                    setSelectedBooking(null);
                    onClose();
                  }}
                  variant="secondary"
                >
                  Open show
                </ButtonLink>
              )}
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Actions>
          </>
        ) : null}
      </Dialog.Root>

      <Dialog.Root
        isOpen={bookingFormOpen}
        onClose={() => setBookingFormOpen(false)}
        className="max-w-3xl"
      >
        <Dialog.Title>Book a Tahti Radio slot</Dialog.Title>
        <Dialog.Description>
          Add the show details for your{' '}
          {selectedDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}{' '}
          broadcast.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            type="time"
            label="Start"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
          <BroadcastDetailsFields
            values={
              {
                title: note,
                description: showDescription,
                coverUrl: showCoverUrl,
                mode: newShowMode,
                showType,
                durationHours,
              } satisfies BroadcastDetailsValues
            }
            shows={shows}
            selectedShowId={selectedShowId}
            episodeNumber={
              shows.find((show) => show.id === selectedShowId)
                ?.nextEpisodeNumber ?? 1
            }
            onShowChange={selectShow}
            onChange={(values) => {
              setNote(values.title);
              setShowDescription(values.description);
              setShowCoverUrl(values.coverUrl);
              setNewShowMode(values.mode);
              setShowType(values.showType);
              setDurationHours(values.durationHours);
            }}
          />
        </div>
        {msg && (
          <p className="mt-3 text-sm" role="status">
            {msg}
          </p>
        )}
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button size="sm" disabled={busy} onClick={() => void book()}>
            {busy ? 'Booking…' : `Book ${durationHours}h slot`}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
