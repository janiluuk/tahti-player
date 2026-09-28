import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import { fetchPublicRadioSlots, type PublicRadioSlot } from '../../api/shows';

export const PROGRAMMING_DAYS = 7;

type Day = { key: string; label: string; slots: PublicRadioSlot[] };

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Groups slots by the local day they start on, in order, skipping days
 * with nothing booked. */
export function groupSlotsByDay(
  slots: readonly PublicRadioSlot[],
  now: Date,
): Day[] {
  const today = dayKey(now);
  const days = new Map<string, Day>();
  for (const slot of [...slots].sort((a, b) =>
    a.startAt.localeCompare(b.startAt),
  )) {
    const start = new Date(slot.startAt);
    const key = dayKey(start);
    const day = days.get(key) ?? {
      key,
      label:
        key === today
          ? 'Today'
          : start.toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
      slots: [],
    };
    day.slots.push(slot);
    days.set(key, day);
  }
  return [...days.values()];
}

/** The week ahead of booked live shows on Tahti Radio, for its channel
 * page's Programming block. */
export function RadioProgrammingGrid({ nowMs }: { nowMs?: number }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; days: Day[]; nowMs: number }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const start = new Date(nowMs ?? Date.now());
    const end = new Date(start.getTime() + PROGRAMMING_DAYS * 86_400_000);
    void fetchPublicRadioSlots(start.toISOString(), end.toISOString()).then(
      (result) => {
        if (cancelled) {
          return;
        }
        if (result.meta.source === 'api' && result.meta.reason) {
          setState({ status: 'error' });
          return;
        }
        setState({
          status: 'ready',
          days: groupSlotsByDay(result.data, start),
          nowMs: start.getTime(),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [nowMs]);

  if (state.status === 'loading') {
    return (
      <p className="text-foreground-secondary text-sm" role="status">
        Loading this week&apos;s shows…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <p className="text-foreground-secondary text-sm">
        This week&apos;s shows couldn&apos;t be loaded.
      </p>
    );
  }
  if (state.days.length === 0) {
    return (
      <p className="text-foreground-secondary text-sm">
        No live shows booked in the next {PROGRAMMING_DAYS} days.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3" data-testid="radio-programming-grid">
      {state.days.map((day) => (
        <section key={day.key} aria-label={day.label}>
          <h3 className="text-foreground-secondary mb-1 text-xs font-semibold tracking-wide uppercase">
            {day.label}
          </h3>
          <ul className="flex flex-col gap-1">
            {day.slots.map((slot) => {
              const onAir =
                new Date(slot.startAt).getTime() <= state.nowMs &&
                new Date(slot.endAt).getTime() > state.nowMs;
              return (
                <li
                  key={slot.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
                >
                  <span className="w-28 shrink-0 tabular-nums">
                    {formatTime(slot.startAt)}–{formatTime(slot.endAt)}
                  </span>
                  {slot.artist.channelSlug ? (
                    <Link
                      to="/radio/show/$channelSlug"
                      params={{ channelSlug: slot.artist.channelSlug }}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {slot.artist.displayName}
                    </Link>
                  ) : (
                    <span className="font-semibold">
                      {slot.artist.displayName}
                    </span>
                  )}
                  <span className="text-foreground-secondary text-xs">
                    {slot.note ||
                      (slot.showType === 'TALK' ? 'Talk show' : 'Live set')}
                  </span>
                  {onAir ? (
                    <Badge variant="pill" color="red">
                      On air
                    </Badge>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
