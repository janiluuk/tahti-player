import { useNavigate } from '@tanstack/react-router';

import { EmptyState, FilterChips, TopList } from '@tahti-player/ui';

import type {
  StatsTopListDimension,
  StatsTopListSort,
} from '../../../api/studio-extras';
import { StudioPanel } from '../../../components/StudioPanel';
import { countryFlagAndName } from '../../../lib/countries';
import {
  formatListenCount,
  formatPlayCount,
  rankingBucketTitle,
} from '../../../lib/topListEntries';
import type { StatsData } from './useStatsData';

export function TopListsTab({
  state,
  active,
}: {
  state: StatsData;
  active: boolean;
}) {
  const navigate = useNavigate();
  const {
    topLists,
    topListDimension,
    setTopListDimension,
    topListSort,
    setTopListSort,
    tracks,
    countries,
    topRangeLabel,
  } = state;

  return (
    <div className={`${active ? '' : 'hidden'} grid gap-6 lg:grid-cols-2`}>
      <StudioPanel title="Content rankings" className="lg:col-span-2">
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChips
            items={[
              { id: 'type', label: 'By type' },
              { id: 'genre', label: 'By genre' },
            ]}
            selected={topListDimension}
            onChange={(id) => setTopListDimension(id as StatsTopListDimension)}
            aria-label="Top list grouping"
          />
          <FilterChips
            items={[
              { id: 'desc', label: 'Most listened' },
              { id: 'asc', label: 'Least listened' },
            ]}
            selected={topListSort}
            onChange={(id) => setTopListSort(id as StatsTopListSort)}
            aria-label="Top list order"
          />
        </div>
        {topLists.length === 0 ? (
          <EmptyState
            size="sm"
            title="No listens recorded for this period yet"
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {topLists.map((bucket) => (
              <TopList
                key={bucket.bucket}
                title={rankingBucketTitle(bucket.bucket)}
                formatValue={formatListenCount}
                entries={bucket.entries.map((entry) => ({
                  id: entry.soundId,
                  label: entry.title,
                  sublabel: entry.genre ?? entry.contentType,
                  value: entry.listens,
                  onClick: () => {
                    void navigate({
                      to: '/studio/sounds/$id',
                      params: { id: entry.soundId },
                    });
                  },
                }))}
              />
            ))}
          </div>
        )}
      </StudioPanel>
      <StudioPanel>
        {tracks.length === 0 ? (
          <EmptyState size="sm" title="No track stats yet" />
        ) : (
          <TopList
            title={`Top tracks · ${topRangeLabel}`}
            formatValue={formatPlayCount}
            entries={tracks.map((track) => ({
              id: track.soundId,
              label: track.title,
              value: track.plays,
              onClick: () => {
                void navigate({
                  to: '/studio/sounds/$id',
                  params: { id: track.soundId },
                });
              },
            }))}
          />
        )}
      </StudioPanel>

      <StudioPanel>
        {countries.length === 0 ? (
          <EmptyState size="sm" title="No country data yet" />
        ) : (
          <TopList
            title={`Top countries · ${topRangeLabel}`}
            formatValue={(value) => value.toLocaleString()}
            entries={countries.map((country) => ({
              id: country.country,
              label: countryFlagAndName(country.country),
              value: country.count,
            }))}
          />
        )}
      </StudioPanel>
    </div>
  );
}
