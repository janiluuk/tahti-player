import { useNavigate } from '@tanstack/react-router';
import { ListFilterIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input, TopList } from '@tahti-player/ui';

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
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';
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

function FilterRow<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      className="border-border flex gap-1 rounded-lg border p-1"
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === option.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
          <div className="flex max-w-4xl flex-col gap-6">
            <StudioPageHeader
              title="Top lists"
              subtitle="Listens are counted once per track per listener per day — a genuine play, not a raw click."
            />

            <div className="flex flex-col gap-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, artist, or channel…"
                aria-label="Search top lists"
                className="max-w-xl"
                startAddon={
                  <SearchIcon
                    size={16}
                    aria-hidden
                    className="text-foreground-secondary"
                  />
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                <ListFilterIcon
                  size={15}
                  aria-hidden
                  className="text-foreground-secondary"
                />
                <FilterRow
                  options={PERIODS}
                  value={period}
                  onChange={setPeriod}
                  label="Top list period"
                />
                <FilterRow
                  options={DIMENSIONS}
                  value={dimension}
                  onChange={setDimension}
                  label="Top list grouping"
                />
                <FilterRow
                  options={SORTS}
                  value={sort}
                  onChange={setSort}
                  label="Top list order"
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
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
