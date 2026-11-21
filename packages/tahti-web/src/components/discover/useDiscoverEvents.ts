import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toBcp47 } from '@tahti-player/i18n';

import {
  fetchEventCalendar,
  type CalendarEvent,
} from '../../api/event-calendar';
import { currentLocale } from '../../lib/locale';
import {
  cityOptions,
  DEFAULT_EVENTS_FILTERS,
  eventsWindow,
  filterEvents,
  hasActiveFilters,
  venueOptions,
  type EventsFilters,
} from './eventFilters';

export const SEARCH_DEBOUNCE_MS = 250;

type Change = (next: EventsFilters, options?: { replace?: boolean }) => void;

export type DiscoverEventsState = ReturnType<typeof useDiscoverEvents>;

/** Loads the calendar window for the chosen range / past view and applies
 * the city, venue and (debounced) text filters on the client. */
export function useDiscoverEvents(
  filters: EventsFilters | undefined,
  onFiltersChange: Change | undefined,
) {
  const [own, setOwn] = useState(DEFAULT_EVENTS_FILTERS);
  const current = filters ?? own;
  const change: Change = useCallback(
    (next, options) => {
      if (onFiltersChange) {
        onFiltersChange(next, options);
      } else {
        setOwn(next);
      }
    },
    [onFiltersChange],
  );
  const locale = toBcp47(currentLocale());
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(current.q);

  const { range, past } = current;
  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    void fetchEventCalendar(eventsWindow({ range, past })).then((result) => {
      if (cancelled) {
        return;
      }
      setLoaded(result.data);
      setError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [range, past, reloadKey]);

  useEffect(() => {
    setQuery(current.q);
  }, [current.q]);

  const latest = useRef({ current, change });
  latest.current = { current, change };
  useEffect(() => {
    if (query.trim() === current.q) {
      return;
    }
    const timer = window.setTimeout(() => {
      const { current: now, change: commit } = latest.current;
      commit({ ...now, q: query.trim() }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, current.q]);

  const cities = useMemo(
    () => cityOptions(loaded ?? [], locale, current.city),
    [loaded, locale, current.city],
  );
  const venues = useMemo(
    () => venueOptions(loaded ?? [], locale, current.city, current.venue),
    [loaded, locale, current.city, current.venue],
  );
  const visible = useMemo(
    () => filterEvents(loaded ?? [], current),
    [loaded, current],
  );

  return {
    current,
    loaded,
    visible,
    error,
    cities,
    venues,
    query,
    setQuery,
    filtered: hasActiveFilters(current),
    retry: () => setReloadKey((key) => key + 1),
    set: (patch: Partial<EventsFilters>) => change({ ...current, ...patch }),
    setCity: (city: string) => {
      const keepVenue =
        !city ||
        !current.venue ||
        venueOptions(loaded ?? [], locale, city).includes(current.venue);
      change({ ...current, city, venue: keepVenue ? current.venue : '' });
    },
    clear: () => {
      setQuery('');
      change({ ...current, city: '', venue: '', q: '' });
    },
  };
}
