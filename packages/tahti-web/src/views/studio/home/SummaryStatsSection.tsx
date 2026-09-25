import {
  BarChart3Icon,
  PlusIcon,
  RadioIcon,
  UploadCloudIcon,
  UsersIcon,
} from 'lucide-react';

import { ButtonLink } from '@tahti-player/ui';

import { SummaryStat } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

export function SummaryStatsSection({ state }: { state: StudioHomeState }) {
  const { stats, hasEmptyDiscography } = state;

  return (
    <>
      <section
        aria-label="Channel summary"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryStat
          label="Plays today"
          value={stats.playsToday}
          note="Open detailed stats"
          icon={RadioIcon}
        />
        <SummaryStat
          label="Total plays"
          value={stats.playsTotal}
          note="All-time audience"
          icon={BarChart3Icon}
        />
        <SummaryStat
          label="Total downloads"
          value={stats.downloadsTotal}
          note={`${stats.downloadsToday.toLocaleString()} today`}
          icon={UploadCloudIcon}
        />
        <SummaryStat
          label="Followers"
          value={stats.followerCount}
          note="Audience overview"
          icon={UsersIcon}
        />
      </section>

      {hasEmptyDiscography ? (
        <div className="border-border bg-background-secondary/30 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <p className="text-sm font-bold">Nothing in your discography yet</p>
            <p className="text-foreground-secondary mt-1 text-xs">
              Add an album or a track to start building it out.
            </p>
          </div>
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
        </div>
      ) : null}
    </>
  );
}
