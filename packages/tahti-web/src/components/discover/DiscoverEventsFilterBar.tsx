import { CalendarDaysIcon, LayoutGridIcon, SearchIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Input, SegmentedControl, Select, Toggle } from '@tahti-player/ui';

import type { EventsRange } from './eventFilters';
import type { DiscoverEventsState } from './useDiscoverEvents';

const RANGE_LABEL_KEYS = {
  upcoming: 'discoverEventsFilters.rangeUpcoming',
  week: 'discoverEventsFilters.rangeWeek',
  month: 'discoverEventsFilters.rangeMonth',
  next3months: 'discoverEventsFilters.rangeNext3Months',
} as const satisfies Record<EventsRange, string>;

/** Range, past, city, venue, search and list / calendar controls of
 * Discover → Events. */
export function DiscoverEventsFilterBar({
  state,
}: {
  state: DiscoverEventsState;
}) {
  const { t } = useTranslation('web');
  const { current, cities, venues, query, setQuery, set, setCity } = state;
  return (
    <div className="flex flex-col gap-3" data-testid="discover-events-filters">
      <div className="flex flex-wrap items-center gap-3">
        {current.past ? null : (
          <SegmentedControl
            aria-label={t('discoverEventsFilters.range')}
            value={current.range}
            onChange={(range) => set({ range })}
            options={(Object.keys(RANGE_LABEL_KEYS) as EventsRange[]).map(
              (id) => ({ id, label: t(RANGE_LABEL_KEYS[id]) }),
            )}
          />
        )}
        <Toggle
          checked={current.past}
          onChange={(past) => set({ past })}
          label={t('discoverEventsFilters.past')}
          showLabel
        />
        <SegmentedControl
          aria-label={t('discoverEventsFilters.view')}
          className="sm:ml-auto"
          value={current.view}
          onChange={(view) => set({ view })}
          options={[
            {
              id: 'list',
              label: t('discoverEventsFilters.viewList'),
              icon: <LayoutGridIcon size={15} />,
            },
            {
              id: 'calendar',
              label: t('discoverEventsFilters.viewCalendar'),
              icon: <CalendarDaysIcon size={15} />,
            },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Input
          type="search"
          aria-label={t('discoverEventsFilters.search')}
          placeholder={t('discoverEventsFilters.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          startAddon={<SearchIcon size={16} aria-hidden />}
        />
        <Select
          aria-label={t('discoverEventsFilters.city')}
          value={current.city}
          onValueChange={setCity}
          options={[
            { id: '', label: t('discoverEventsFilters.allCities') },
            ...cities.map((city) => ({ id: city, label: city })),
          ]}
        />
        <Select
          aria-label={t('discoverEventsFilters.venue')}
          value={current.venue}
          onValueChange={(venue) => set({ venue })}
          options={[
            { id: '', label: t('discoverEventsFilters.allVenues') },
            ...venues.map((venue) => ({ id: venue, label: venue })),
          ]}
        />
      </div>
    </div>
  );
}
