import { useNavigate } from '@tanstack/react-router';
import { ListFilterIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  FilterChips,
  Input,
  TopList,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAdminTopLists,
  type AdminTopListBucket,
  type AdminTopListDimension,
  type AdminTopListPeriod,
  type AdminTopListSort,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import {
  formatListenCount,
  rankingBucketTitle,
} from '../../lib/topListEntries';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { usePlayerStore } from '../../stores/playerStore';

function periods(
  t: TFunction<'web'>,
): { id: AdminTopListPeriod; label: string }[] {
  return [
    { id: 'month', label: t('adminTopListsViewMore.month') },
    { id: 'half_year', label: t('adminTopListsViewMore.halfYear') },
    { id: 'all_time', label: t('adminTopListsViewMore.allTime') },
  ];
}

function dimensions(
  t: TFunction<'web'>,
): { id: AdminTopListDimension; label: string }[] {
  return [
    { id: 'type', label: t('adminTopListsViewMore.byType') },
    { id: 'genre', label: t('adminTopListsViewMore.byGenre') },
  ];
}

function sorts(t: TFunction<'web'>): { id: AdminTopListSort; label: string }[] {
  return [
    { id: 'desc', label: t('adminTopListsViewMore.mostListened') },
    { id: 'asc', label: t('adminTopListsViewMore.leastListened') },
  ];
}

export function AdminTopListsView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const play = usePlayerStore((state) => state.play);
  const [period, setPeriod] = useState<AdminTopListPeriod>('month');
  const [dimension, setDimension] = useState<AdminTopListDimension>('type');
  const [sort, setSort] = useState<AdminTopListSort>('desc');
  const [query, setQuery] = useState('');
  const snapshot = useSnapshotFetch<AdminTopListBucket[]>(
    `admin-top-lists:${period}:${dimension}:${sort}`,
    async () => apiResult(await fetchAdminTopLists(period, dimension, sort)),
  );
  const buckets = snapshot.data ?? [];
  const { loading, error: loadError, retry } = snapshot;

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
          <ViewShell
            title={t('adminTopListsView.topLists')}
            classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
          >
            <div className="flex flex-col gap-3">
              <Input
                enterKeyHint="search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('adminTopListsView.searchTitleArtistOrChannel')}
                aria-label={t('adminTopListsView.searchTopLists')}
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
                  items={periods(t)}
                  selected={period}
                  onChange={(id) => setPeriod(id as AdminTopListPeriod)}
                  aria-label={t('adminTopListsView.topListPeriod')}
                />
                <FilterChips
                  items={dimensions(t)}
                  selected={dimension}
                  onChange={(id) => setDimension(id as AdminTopListDimension)}
                  aria-label={t('adminTopListsView.topListGrouping')}
                />
                <FilterChips
                  items={sorts(t)}
                  selected={sort}
                  onChange={(id) => setSort(id as AdminTopListSort)}
                  aria-label={t('adminTopListsView.topListOrder')}
                />
              </div>
            </div>

            {loading ? (
              <StudioPanel>
                <PageLoading label={t('loading.loadingTopLists')} />
              </StudioPanel>
            ) : loadError && buckets.length === 0 ? (
              <StudioPanel>
                <PageError
                  title={t('loadErrors.couldNotLoadTopLists')}
                  description={loadError}
                  onRetry={retry}
                />
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
                  action={
                    normalizedQuery ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setQuery('')}
                      >
                        {t('adminTopListsView.clearSearch')}
                      </Button>
                    ) : undefined
                  }
                />
              </StudioPanel>
            ) : (
              visibleBuckets.map((bucket) => (
                <StudioPanel key={bucket.bucket}>
                  <TopList
                    title={rankingBucketTitle(bucket.bucket)}
                    headingLevel={2}
                    formatValue={formatListenCount}
                    entries={bucket.entries.map((entry) => ({
                      id: entry.soundId,
                      label: entry.title,
                      sublabel: entry.artistName,
                      value: entry.listens,
                      onClick: () => {
                        if (entry.audioUrl) {
                          play({
                            id: `sound:${entry.soundId}`,
                            kind: 'sound',
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
