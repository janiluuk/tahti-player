import { CalendarIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink } from '@tahti-player/ui';

import { PageError } from '../../../components/PageStates';
import { formatScheduleWindow } from '../../../lib/scheduleTime';
import { Group } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

/** The programme itself is the Broadcast agenda; Home only says what is next
 * and links there, so there is one list to keep in sync. */
export function UpcomingShowsSection({ state }: { state: StudioHomeState }) {
  const { t } = useTranslation('web');
  const { upcomingShows, scheduleError, reloadOverview } = state;

  if (scheduleError && upcomingShows.length === 0) {
    return (
      <Group title={t('upcomingShowsSection.upcomingShows')}>
        <PageError
          title={t('loadErrors.couldNotLoadUpcomingShows')}
          description={scheduleError}
          onRetry={reloadOverview}
        />
      </Group>
    );
  }

  const next = upcomingShows[0];
  if (!next) {
    return null;
  }

  return (
    <Group title={t('upcomingShowsSection.upcomingShows')}>
      <div
        className="border-border flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
        data-testid="studio-home-next-show"
      >
        <span className="bg-accent-blue/15 text-accent-blue-strong flex size-10 shrink-0 items-center justify-center rounded-lg">
          <CalendarIcon size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {t('upcomingShowsSection.nextUp', { title: next.title })}
          </p>
          <p className="text-foreground-secondary text-xs">
            <time dateTime={next.startAt}>
              {formatScheduleWindow(next.startAt)}
            </time>
            {upcomingShows.length > 1
              ? ` · ${t('upcomingShowsSection.moreComingUp', {
                  count: upcomingShows.length - 1,
                })}`
              : ''}
          </p>
        </div>
        <ButtonLink to="/studio/broadcast" size="sm" variant="secondary">
          {t('upcomingShowsSection.openAgenda')}
        </ButtonLink>
      </div>
    </Group>
  );
}
