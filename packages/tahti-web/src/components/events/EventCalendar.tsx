import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  RssIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { toBcp47, useTranslation } from '@tahti-player/i18n';
import { Button, ExternalLink, SegmentedControl } from '@tahti-player/ui';

import {
  eventsIcsUrl,
  fetchEventCalendar,
  type CalendarEvent,
} from '../../api/event-calendar';
import { currentLocale } from '../../lib/locale';
import { PageEmpty, PageLoading } from '../PageStates';
import { EventCard } from './EventCard';

type Layout = 'month' | 'agenda';

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Month grid of every public event (agenda list on phones). */
export function EventCalendar({ initialMonth }: { initialMonth?: Date }) {
  const { t } = useTranslation('web');
  const locale = toBcp47(currentLocale());
  const [month, setMonth] = useState(() =>
    monthStart(initialMonth ?? new Date()),
  );
  const [layout, setLayout] = useState<Layout>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
      ? 'agenda'
      : 'month',
  );
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    void fetchEventCalendar({ from: month, to }).then((result) => {
      if (!cancelled) {
        setEvents(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events ?? []) {
      const key = dayKey(new Date(event.startAt));
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const monthLabel = month.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const shift = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
    ),
  ];
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 10, 2 + i).toLocaleDateString(locale, { weekday: 'short' }),
  );
  const todayKey = dayKey(new Date());

  return (
    <section className="flex flex-col gap-4" data-testid="event-calendar">
      <header className="flex flex-wrap items-center gap-2">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={t('events.previousMonth')}
          onClick={() => shift(-1)}
        >
          <ChevronLeftIcon size={16} aria-hidden />
        </Button>
        <h2
          className="min-w-40 text-center text-lg font-semibold capitalize"
          aria-live="polite"
        >
          {monthLabel}
        </h2>
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={t('events.nextMonth')}
          onClick={() => shift(1)}
        >
          <ChevronRightIcon size={16} aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="text"
          onClick={() => setMonth(monthStart(new Date()))}
        >
          {t('events.today')}
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <ExternalLink
            href={eventsIcsUrl()}
            className="text-primary-strong inline-flex items-center gap-1.5 text-xs"
          >
            <RssIcon size={14} aria-hidden />
            {t('events.subscribe')}
          </ExternalLink>
          <SegmentedControl
            aria-label={t('events.calendarLayout')}
            iconOnly
            value={layout}
            onChange={setLayout}
            options={[
              {
                id: 'month',
                label: t('events.monthGrid'),
                icon: <CalendarDaysIcon size={15} />,
              },
              {
                id: 'agenda',
                label: t('events.agenda'),
                icon: <ListIcon size={15} />,
              },
            ]}
          />
        </div>
      </header>

      {events === null ? (
        <PageLoading label={t('events.loading')} />
      ) : layout === 'agenda' ? (
        events.length === 0 ? (
          <PageEmpty title={t('events.noEventsThisMonth')} />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="event-agenda">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  linkToPage
                  host={{
                    displayName: event.artistDisplayName,
                    channelSlug: event.channelSlug,
                  }}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <div
          role="group"
          aria-label={monthLabel}
          className="border-border grid grid-cols-7 overflow-hidden rounded-lg border"
          data-testid="event-month-grid"
        >
          <div className="contents">
            {weekdays.map((day) => (
              <div
                key={day}
                aria-hidden
                className="bg-background-secondary border-border border-b px-2 py-1 text-xs font-semibold"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="contents">
            {cells.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`blank-${index}`}
                    aria-hidden
                    className="border-border bg-background-secondary/40 min-h-24 border-r border-b"
                  />
                );
              }
              const key = dayKey(date);
              const dayEvents = byDay.get(key) ?? [];
              const label = date.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              });
              return (
                <div
                  key={key}
                  role="group"
                  aria-label={
                    dayEvents.length > 0
                      ? t('events.eventsOnDay', { day: label })
                      : label
                  }
                  className="border-border flex min-h-24 min-w-0 flex-col gap-1 border-r border-b p-1"
                >
                  <span
                    className={`self-end rounded-full px-1.5 text-xs ${key === todayKey ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground-secondary'}`}
                  >
                    {date.getDate()}
                  </span>
                  {dayEvents.slice(0, 2).map((event) => (
                    <Link
                      key={event.id}
                      to="/events/$eventId"
                      params={{ eventId: event.id }}
                      className={`truncate rounded px-1 py-0.5 text-xs hover:underline ${event.status === 'CANCELLED' ? 'bg-accent-red/15 line-through' : 'bg-primary/15'}`}
                      title={`${event.title} · ${event.artistDisplayName}`}
                    >
                      {event.title}
                    </Link>
                  ))}
                  {dayEvents.length > 2 ? (
                    <span className="text-foreground-secondary px-1 text-xs">
                      {t('events.moreOnDay', { count: dayEvents.length - 2 })}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {events !== null && layout === 'month' && events.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          {t('events.noEventsThisMonth')}
        </p>
      ) : null}
    </section>
  );
}
