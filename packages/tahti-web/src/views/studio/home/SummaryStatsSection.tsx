import {
  BarChart3Icon,
  PlusIcon,
  RadioIcon,
  UploadCloudIcon,
  UsersIcon,
} from 'lucide-react';

import { ButtonLink } from '@tahti-player/ui';

import { PageEmpty, PageError } from '../../../components/PageStates';
import { STUDIO_METRIC_TONES } from '../stats/metricTones';
import { SummaryStat } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

export function SummaryStatsSection({ state }: { state: StudioHomeState }) {
  const { stats, statsError, hasEmptyDiscography, reloadOverview } = state;

  return (
    <>
      {statsError ? (
        <PageError
          title="Could not load channel summary"
          description={statsError}
          onRetry={reloadOverview}
        />
      ) : (
        <section
          aria-label="Channel summary"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <SummaryStat
            label="Plays today"
            value={stats.playsToday}
            note="Open detailed stats"
            icon={RadioIcon}
            tone={STUDIO_METRIC_TONES.plays}
          />
          <SummaryStat
            label="Total plays"
            value={stats.playsTotal}
            note="All-time audience"
            icon={BarChart3Icon}
            tone={STUDIO_METRIC_TONES.plays}
          />
          <SummaryStat
            label="Total downloads"
            value={stats.downloadsTotal}
            note={`${stats.downloadsToday.toLocaleString()} today`}
            icon={UploadCloudIcon}
            tone={STUDIO_METRIC_TONES.downloads}
          />
          <SummaryStat
            label="Followers"
            value={stats.followerCount}
            note="Audience overview"
            icon={UsersIcon}
            tone={STUDIO_METRIC_TONES.followers}
          />
        </section>
      )}

      {hasEmptyDiscography ? (
        <PageEmpty
          title="Nothing in your discography yet"
          description="Add an album or a track to start building it out."
          action={
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                to="/studio/releases"
                search={{ create: true }}
                size="sm"
                variant="secondary"
              >
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                Add an album
              </ButtonLink>
              <ButtonLink to="/library/upload" size="sm">
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                Add a track
              </ButtonLink>
            </div>
          }
        />
      ) : null}
    </>
  );
}
