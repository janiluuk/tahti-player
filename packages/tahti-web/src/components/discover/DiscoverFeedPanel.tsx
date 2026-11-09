import { CalendarDaysIcon, NewspaperIcon } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SegmentedControl } from '@tahti-player/ui';

import { EventCalendar } from '../events/EventCalendar';
import { PageLoading } from '../PageStates';
import { CommunityStoriesWidget } from './CommunityStoriesWidget';

const FeedView = lazy(() =>
  import('../../views/FeedView').then((m) => ({ default: m.FeedView })),
);

/** Discover → Feed: the story feed, or the event calendar next to it. */
export function DiscoverFeedPanel({
  calendar,
  onCalendarChange,
}: {
  calendar: boolean;
  onCalendarChange: (calendar: boolean) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-6" data-testid="discover-feed">
      <SegmentedControl
        aria-label={t('events.feedView')}
        className="self-start"
        value={calendar ? 'calendar' : 'stories'}
        onChange={(view) => onCalendarChange(view === 'calendar')}
        options={[
          {
            id: 'stories',
            label: t('events.stories'),
            icon: <NewspaperIcon size={15} />,
          },
          {
            id: 'calendar',
            label: t('events.calendar'),
            icon: <CalendarDaysIcon size={15} />,
          },
        ]}
      />
      {calendar ? (
        <EventCalendar />
      ) : (
        <>
          <CommunityStoriesWidget />
          <Suspense
            fallback={<PageLoading label={t('discover.loadingFeed')} />}
          >
            <FeedView embedded />
          </Suspense>
        </>
      )}
    </div>
  );
}
