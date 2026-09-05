import { useNavigate } from '@tanstack/react-router';
import { ListFilterIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FilterChips, Input, TopList, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminTopLists,
  type AdminTopListBucket,
  type AdminTopListDimension,
  type AdminTopListPeriod,
  type AdminTopListSort,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import {
  formatListenCount,
  rankingBucketTitle,
} from '../../lib/topListEntries';
import { usePlayerStore } from '../../stores/playerStore';

const PERIODS: { id: AdminTopListPeriod; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'half_year', label: 'Half year' },
  { id: 'all_time', label: 'All time' },
];

const DIMENSIONS: { id: AdminTopListDimension; label: string }[] = [
  { id: 'type', label: 'By type' },
  { id: 'genre', label: 'By genre' },
];

const SORTS: { id: AdminTopListSort; label: string }[] = [
  { id: 'desc', label: 'Most listened' },
  { id: 'asc', label: 'Least listened' },
];

export function AdminTopListsView() {
  const navigate = useNavigate();
  const play = usePlayerStore((state) => state.play);
  const [period, setPeriod] = useState<AdminTopListPeriod>('month');
  const [dimension, setDimension] = useState<AdminTopListDimension>('type');
  const [sort, setSort] = useState<AdminTopListSort>('desc');
  const [query, setQuery] = useState('');
  const [buckets, setBuckets] = useState<AdminTopListBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchAdminTopLists(period, dimension, sort).then((result) => {
      setBuckets(result.data);
      setLoading(false);
    });
  }, [period, dimension, sort]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleBuckets = buckets
    .map((bucket) => ({
      ...bucket,
      entries: bucket.entries.filter((entry) => {
        if (!normalizedQuery) {
          return true;
        }
        return [entry.title, entry.artistName, entry.channelSlug].some(
          (value) => value.toLowerCase().includes(normalizedQuery),
        );
      }),
    }))
    .filter((bucket) => bucket.entries.length > 0);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/top-lists">
          <ViewShell title="Top lists" classes={{ root: 'px-0 pt-0' }}>
            <div className="flex flex-col gap-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, artist, or channel…"
                aria-label="Search top lists"
                className="max-w-xl"
                startAddon={
                  <SearchIcon size={16} aria-hidden className="opacity-70" />
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                <ListFilterIcon
                  size={15}
                  aria-hidden
                  className="text-foreground-secondary"
                />
                <FilterChips
                  items={PERIODS}
                  selected={period}
                  onChange={(id) => setPeriod(id as AdminTopListPeriod)}
                  aria-label="Top list period"
                />
                <FilterChips
                  items={DIMENSIONS}
                  selected={dimension}
                  onChange={(id) => setDimension(id as AdminTopListDimension)}
                  aria-label="Top list grouping"
                />
                <FilterChips
                  items={SORTS}
                  selected={sort}
                  onChange={(id) => setSort(id as AdminTopListSort)}
                  aria-label="Top list order"
                />
              </div>
            </div>

            {loading ? (
              <StudioPanel>
                <PageLoading label="Loading top lists…" />
              </StudioPanel>
            ) : visibleBuckets.length === 0 ? (
              <StudioPanel>
                <PageEmpty
                  title={
                    normalizedQuery
                      ? 'No matching top-list entries'
                      : 'No listens yet'
                  }
                  description={
                    normalizedQuery
                      ? 'Try another search, period, or grouping.'
                      : 'No listens recorded for this period yet.'
                  }
                />
              </StudioPanel>
            ) : (
              visibleBuckets.map((bucket) => (
                <StudioPanel key={bucket.bucket}>
                  <TopList
                    title={rankingBucketTitle(bucket.bucket)}
                    formatValue={formatListenCount}
                    entries={bucket.entries.map((entry) => ({
                      id: entry.soundId,
                      label: entry.title,
                      sublabel: entry.artistName,
                      value: entry.listens,
                      onClick: () => {
                        if (entry.audioUrl) {
                          play({
                            id: `archive:${entry.soundId}`,
                            kind: 'archive',
                            title: entry.title,
                            artist: entry.artistName,
                            streamUrl: entry.audioUrl,
                            protocol: 'https',
                            channelSlug: entry.channelSlug,
                          });
                          return;
                        }
                        void navigate({
                          to: '/studio/sounds/$id',
                          params: { id: entry.soundId },
                        });
                      },
                    }))}
                  />
                </StudioPanel>
              ))
            )}
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
