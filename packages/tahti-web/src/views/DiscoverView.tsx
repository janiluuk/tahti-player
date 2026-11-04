import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  CompassIcon,
  MapPinIcon,
  NewspaperIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import {
  Button,
  FilterChips,
  Masonry,
  Select,
  TabLabel,
  Tabs,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchDirectory,
  fetchTrackDetail,
  type FetchMeta,
} from '../api/client';
import {
  fetchArtistOfTheWeek,
  fetchLatestTracks,
  fetchLovedTracks,
  fetchNewToYou,
  fetchPublicCollections,
  fetchRandomArtist,
  fetchTahtiSelects,
  fetchTopTracks,
} from '../api/discover';
import type { DiscoverArtistOfWeek } from '../api/discover';
import {
  fetchLatestReleases,
  type LatestRelease,
} from '../api/latest-releases';
import type {
  ChannelDirectoryItem,
  DiscoverCollection,
  DiscoverTrackItem,
  TahtiPlayable,
} from '../api/types';
import { DirectoryArtistsBrowser } from '../components/DirectoryArtistsBrowser';
import { CommunityStoriesWidget } from '../components/discover/CommunityStoriesWidget';
import { DiscoverAddWidgetButton } from '../components/discover/DiscoverAddWidgetButton';
import {
  DiscoverWaveformPlayer,
  type DiscoverSelection,
} from '../components/discover/DiscoverWaveformPlayer';
import { RandomTrackGenres } from '../components/discover/RandomTrackGenres';
import { WidgetCard } from '../components/discover/WidgetCard';
import {
  pickRandomTrack,
  TOP_LIST_WIDGET_IDS,
  WIDGET_LABEL_KEYS,
} from '../components/discover/widgetMeta';
import { DiscoverGatewayBackground } from '../components/DiscoverGatewayBackground';
import { GroupsDirectory } from '../components/GroupsDirectory';
import { LatestNewsWidget } from '../components/LatestNewsWidget';
import { HomeNews } from '../components/listen-view/HomeNews';
import { PageError, PageLoading } from '../components/PageStates';
import { VenuesDirectory } from '../components/VenuesDirectory';
import { CONTENT_TYPES } from '../content/contentTypes';
import { hasAccountRole } from '../lib/accountRoles';
import { ALL_FILTER_ID, allOrSpecific } from '../lib/allOrSpecific';
import { discoverTabFromSearch, type DiscoverTab } from '../lib/discoverTabs';
import { PRESET_GENRES } from '../lib/genres';
import { useAuthStore } from '../stores/authStore';
import {
  ALL_WIDGET_IDS,
  useDiscoverStore,
  type DiscoverWidgetId,
} from '../stores/discoverStore';
import {
  newsWidgetsOn,
  useListenerWidgetsStore,
} from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';

function apiReason(meta: FetchMeta): string | null {
  return meta.source === 'api' ? (meta.reason ?? null) : null;
}

type WidgetData = {
  loading: boolean;
  error?: string | null;
  items: DiscoverTrackItem[];
  collections?: DiscoverCollection[];
  releases?: LatestRelease[];
  subtitle?: string;
  artist?: DiscoverArtistOfWeek;
};

const FeedView = lazy(() =>
  import('./FeedView').then((m) => ({ default: m.FeedView })),
);

const DISCOVER_TABS: Array<{
  id: DiscoverTab;
  labelKey: ParseKeys<'web'>;
  icon: typeof CompassIcon;
}> = [
  { id: 'discover', labelKey: 'discover.tabDiscover', icon: CompassIcon },
  { id: 'feed', labelKey: 'discover.tabFeed', icon: NewspaperIcon },
  { id: 'artists', labelKey: 'discover.tabArtists', icon: UsersIcon },
  { id: 'groups', labelKey: 'discover.tabGroups', icon: UsersRoundIcon },
  { id: 'venues', labelKey: 'discover.tabVenues', icon: MapPinIcon },
];

export function DiscoverView() {
  const { t } = useTranslation('web');
  const enabledWidgets = useDiscoverStore((s) => s.enabledWidgets);
  const columnWidgets = enabledWidgets;
  const genreFilter = useDiscoverStore((s) => s.genreFilter);
  const contentTypeFilter = useDiscoverStore((s) => s.contentTypeFilter);
  const storeAddWidget = useDiscoverStore((s) => s.addWidget);
  const [justAdded, setJustAdded] = useState<DiscoverWidgetId | null>(null);
  const addWidget = (id: DiscoverWidgetId) => {
    storeAddWidget(id);
    setJustAdded(id);
  };
  useEffect(() => {
    if (!justAdded) {
      return;
    }
    document
      .querySelector(`[data-widget-id="${justAdded}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [justAdded]);
  const removeWidget = useDiscoverStore((s) => s.removeWidget);
  const moveWidget = useDiscoverStore((s) => s.moveWidget);
  const setGenreFilter = useDiscoverStore((s) => s.setGenreFilter);
  const setContentTypeFilter = useDiscoverStore((s) => s.setContentTypeFilter);
  const randomArtistRotationDays = useDiscoverStore(
    (s) => s.randomArtistRotationDays,
  );
  const setRandomArtistRotationDays = useDiscoverStore(
    (s) => s.setRandomArtistRotationDays,
  );
  const randomTrackGenres = useDiscoverStore((s) => s.randomTrackGenres);
  const setRandomTrackGenres = useDiscoverStore((s) => s.setRandomTrackGenres);
  const randomTrackPool = useRef<DiscoverTrackItem[]>([]);
  const newsInstances = useListenerWidgetsStore((s) => s.instances);
  const newsFeeds = newsWidgetsOn(newsInstances, 'discover');
  const play = usePlayerStore((state) => state.play);
  const user = useAuthStore((state) => state.user);
  const isAdmin = hasAccountRole(user, 'BOARD');
  const [data, setData] = useState<Record<string, WidgetData>>({});
  const [genresOpen, setGenresOpen] = useState(false);
  const [contentTypesOpen, setContentTypesOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DiscoverSelection | null>(
    null,
  );
  const [artists, setArtists] = useState<ChannelDirectoryItem[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistsError, setArtistsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const search = useSearch({ strict: false }) as { tab?: string };
  const activeTab = discoverTabFromSearch(search.tab);
  const navigate = useNavigate();

  const filters = useMemo(
    () => ({ genres: genreFilter, contentTypes: contentTypeFilter }),
    [genreFilter, contentTypeFilter],
  );

  useEffect(() => {
    let cancelled = false;
    setArtistsLoading(true);
    void fetchDirectory().then((result) => {
      if (!cancelled) {
        setArtists(
          result.data.items.filter((artist) => artist.slug !== 'tahti-radio'),
        );
        setArtistsError(apiReason(result.meta));
        setArtistsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contentTypeFilter, genreFilter, randomArtistRotationDays, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    for (const id of enabledWidgets) {
      setData((prev) => ({
        ...prev,
        [id]: { loading: true, items: prev[id]?.items ?? [] },
      }));

      const load = async (): Promise<WidgetData> => {
        switch (id) {
          case 'artist-of-the-week': {
            const { data: artist, meta } = await fetchArtistOfTheWeek();
            return {
              loading: false,
              error: apiReason(meta),
              items: [],
              artist: artist ?? undefined,
            };
          }
          case 'random-artist': {
            const { data: artist, meta } = await fetchRandomArtist(
              randomArtistRotationDays,
            );
            return {
              loading: false,
              error: apiReason(meta),
              items: [],
              artist: artist ?? undefined,
            };
          }
          case 'this-week-most-played': {
            const { data: items, meta } = await fetchTopTracks(
              'week',
              'desc',
              filters,
            );
            return { loading: false, error: apiReason(meta), items };
          }
          case 'this-week-least-played': {
            const { data: items, meta } = await fetchTopTracks(
              'week',
              'asc',
              filters,
            );
            return { loading: false, error: apiReason(meta), items };
          }
          case 'most-played': {
            const { data: items, meta } = await fetchTopTracks(
              'all_time',
              'desc',
              filters,
            );
            return { loading: false, error: apiReason(meta), items };
          }
          case 'latest-tracks': {
            const { data: items, meta } = await fetchLatestTracks(filters);
            return { loading: false, error: apiReason(meta), items };
          }
          case 'new-to-you': {
            const res = await fetchNewToYou();
            return {
              loading: false,
              error: apiReason(res.meta),
              items: res.data,
              subtitle: res.authenticated
                ? res.preferenceGenres.length > 0
                  ? `Based on ${res.preferenceGenres.join(', ')}`
                  : undefined
                : 'Sign in for picks based on your taste',
            };
          }
          case 'loved': {
            const { data: items, meta } = await fetchLovedTracks(filters);
            return { loading: false, error: apiReason(meta), items };
          }
          case 'public-playlists': {
            const { data: collections, meta } =
              await fetchPublicCollections(filters);
            return {
              loading: false,
              error: apiReason(meta),
              items: [],
              collections,
            };
          }
          case 'latest-releases': {
            const { data: releases, meta } = await fetchLatestReleases();
            return {
              loading: false,
              error: apiReason(meta),
              items: [],
              releases,
            };
          }
          case 'random-track': {
            const trackFilters = {
              genres: randomTrackGenres,
              contentTypes: [],
            };
            const [latest, top] = await Promise.all([
              fetchLatestTracks(trackFilters),
              fetchTopTracks('all_time', 'desc', trackFilters),
            ]);
            const pool = [
              ...new Map(
                [...latest.data, ...top.data].map((item) => [item.id, item]),
              ).values(),
            ];
            randomTrackPool.current = pool;
            return {
              loading: false,
              error: apiReason(latest.meta) ?? apiReason(top.meta),
              items: pickRandomTrack(pool, null),
            };
          }
          case 'tahti-selects': {
            const { data: items, meta } = await fetchTahtiSelects();
            return {
              loading: false,
              error: apiReason(meta),
              items,
              subtitle: 'Picked for the Tahti Selects rotation',
            };
          }
        }
      };

      void load().then((result) => {
        if (!cancelled) {
          setData((prev) => ({ ...prev, [id]: result }));
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [
    enabledWidgets,
    filters,
    randomArtistRotationDays,
    randomTrackGenres,
    reloadKey,
  ]);

  const shuffleRandomTrack = () =>
    setData((prev) => {
      const current = prev['random-track'];
      return current
        ? {
            ...prev,
            'random-track': {
              ...current,
              items: pickRandomTrack(
                randomTrackPool.current,
                current.items[0]?.id ?? null,
              ),
            },
          }
        : prev;
    });

  const availableToAdd = ALL_WIDGET_IDS.filter(
    (id) => !enabledWidgets.includes(id),
  );

  const selectTrack = async (item: DiscoverTrackItem) => {
    const detail = (await fetchTrackDetail(item.id.replace(/^sound:/, '')))
      .data;
    if (!detail?.audioUrl) {
      return;
    }
    const playable: TahtiPlayable = {
      id: item.id,
      kind: 'sound',
      title: detail.title,
      artist: detail.artistName,
      coverUrl: detail.bannerUrl ?? item.coverUrl ?? undefined,
      streamUrl: detail.audioUrl,
      protocol: detail.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: detail.channelSlug,
      durationSec: detail.durationSec ?? undefined,
      peaks: detail.peaks,
    };
    setSelectedTrack({ item, playable });
    play(playable);
  };

  return (
    <div className="relative flex w-full max-w-7xl flex-col gap-3 sm:gap-4">
      <DiscoverGatewayBackground />
      <Tabs.Root
        selectedIndex={Math.max(
          0,
          DISCOVER_TABS.findIndex((item) => item.id === activeTab),
        )}
        onChange={(index) => {
          const next = DISCOVER_TABS[index];
          if (!next) {
            return;
          }
          void navigate({
            to: '/discover',
            search: next.id === 'discover' ? {} : { tab: next.id },
          });
        }}
      >
        <Tabs.List aria-label={t('discover.sections')}>
          {DISCOVER_TABS.map((item) => (
            <Tabs.Tab key={item.id}>
              <span data-testid={`discover-tab-${item.id}`}>
                <TabLabel icon={<item.icon size={14} />}>
                  {t(item.labelKey)}
                </TabLabel>
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <ViewShell
        title={t('nav.discover')}
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        actions={
          activeTab === 'discover' ? (
            <DiscoverAddWidgetButton
              availableToAdd={availableToAdd}
              onAdd={addWidget}
            />
          ) : undefined
        }
      >
        {activeTab === 'venues' ? (
          <header className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              to="/venues/register"
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              {t('discover.registerVenue')}
            </Link>
            {user ? (
              <Link
                to="/venues/mine"
                className="text-sm font-medium underline-offset-2 hover:underline"
              >
                {t('discover.myVenues')}
              </Link>
            ) : null}
          </header>
        ) : null}

        {activeTab === 'feed' ? (
          <div className="flex flex-col gap-6" data-testid="discover-feed">
            <CommunityStoriesWidget />
            <Suspense
              fallback={<PageLoading label={t('discover.loadingFeed')} />}
            >
              <FeedView embedded />
            </Suspense>
          </div>
        ) : null}

        {activeTab === 'groups' ? <GroupsDirectory /> : null}

        {activeTab === 'discover' ? <HomeNews /> : null}

        {activeTab === 'discover' ? (
          <div className="flex flex-col gap-3">
            <div
              data-testid="discover-filters"
              className="flex flex-wrap items-center gap-2"
            >
              <Button
                size="sm"
                variant="secondary"
                aria-expanded={genresOpen}
                onClick={() => setGenresOpen((open) => !open)}
              >
                <SlidersHorizontalIcon
                  size={15}
                  className="mr-1.5"
                  aria-hidden
                />
                {t('discover.genres')}
                {genreFilter.length > 0 ? ` (${genreFilter.length})` : ''}
                <ChevronDownIcon
                  size={15}
                  className={`ml-1.5 transition-transform ${genresOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                aria-expanded={contentTypesOpen}
                onClick={() => setContentTypesOpen((open) => !open)}
              >
                <SlidersHorizontalIcon
                  size={15}
                  className="mr-1.5"
                  aria-hidden
                />
                {t('discover.types')}
                {contentTypeFilter.length > 0
                  ? ` (${contentTypeFilter.length})`
                  : ''}
                <ChevronDownIcon
                  size={15}
                  className={`ml-1.5 transition-transform ${contentTypesOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </Button>
            </div>
            {genresOpen ? (
              <FilterChips
                aria-label={t('discover.genres')}
                multiple
                items={[
                  { id: ALL_FILTER_ID, label: t('discover.all') },
                  ...PRESET_GENRES.map((g) => ({ id: g, label: g })),
                ]}
                selected={
                  genreFilter.length > 0 ? genreFilter : [ALL_FILTER_ID]
                }
                onChange={(selected) =>
                  setGenreFilter(allOrSpecific(selected, genreFilter))
                }
              />
            ) : null}
            {contentTypesOpen ? (
              <FilterChips
                aria-label={t('discover.contentTypes')}
                multiple
                items={[
                  { id: ALL_FILTER_ID, label: t('discover.all') },
                  ...CONTENT_TYPES,
                ]}
                selected={
                  contentTypeFilter.length > 0
                    ? contentTypeFilter
                    : [ALL_FILTER_ID]
                }
                onChange={(selected) =>
                  setContentTypeFilter(
                    allOrSpecific(selected, contentTypeFilter),
                  )
                }
              />
            ) : null}
          </div>
        ) : null}

        {activeTab === 'discover' && newsFeeds.length > 0 ? (
          <div className="mb-4">
            <LatestNewsWidget surface="discover" />
          </div>
        ) : null}

        {activeTab === 'discover' && columnWidgets.length > 0 && (
          <Masonry data-testid="discover-widget-columns">
            {columnWidgets.map((id, index) => {
              const widgetData = data[id];
              return (
                <motion.div
                  key={id}
                  data-widget-id={id}
                  className="min-w-0"
                  initial={id === justAdded ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <WidgetCard
                    id={id}
                    title={t(WIDGET_LABEL_KEYS[id])}
                    subtitle={widgetData?.subtitle}
                    loading={widgetData?.loading ?? true}
                    error={widgetData?.error}
                    onRetry={() => setReloadKey((n) => n + 1)}
                    items={widgetData?.items ?? []}
                    collections={widgetData?.collections}
                    releases={widgetData?.releases}
                    artist={widgetData?.artist}
                    showRank={TOP_LIST_WIDGET_IDS.has(id)}
                    emptyMessage={
                      id === 'loved'
                        ? t('discover.emptyLoved')
                        : id === 'public-playlists'
                          ? t('discover.emptyPlaylists')
                          : id === 'tahti-selects'
                            ? t('discover.emptySelects')
                            : id === 'latest-releases'
                              ? t('discover.emptyReleases')
                              : id === 'random-track'
                                ? t('discover.emptyGenres')
                                : t('discover.emptyDefault')
                    }
                    canMoveUp={index > 0}
                    canMoveDown={index < columnWidgets.length - 1}
                    onMove={moveWidget}
                    onRemove={removeWidget}
                    isAdmin={isAdmin}
                    onSelectTrack={(track) => void selectTrack(track)}
                    toolbar={
                      id === 'random-track' ? (
                        <RandomTrackGenres
                          genres={randomTrackGenres}
                          onChange={setRandomTrackGenres}
                          onShuffle={shuffleRandomTrack}
                          shuffleDisabled={
                            (widgetData?.loading ?? true) ||
                            randomTrackPool.current.length < 2
                          }
                        />
                      ) : undefined
                    }
                    settings={
                      id === 'random-artist' ? (
                        <Select
                          label="Keep the same pick for"
                          value={String(randomArtistRotationDays)}
                          onValueChange={(value) =>
                            setRandomArtistRotationDays(Number(value))
                          }
                          options={[
                            { id: '1', label: '1 day' },
                            { id: '3', label: '3 days' },
                            { id: '7', label: '7 days' },
                            { id: '14', label: '14 days' },
                            { id: '30', label: '30 days' },
                          ]}
                        />
                      ) : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </Masonry>
        )}

        {activeTab === 'artists' && artistsError && artists.length === 0 ? (
          <PageError
            title={t('discover.artistDirectoryError')}
            description={artistsError}
            onRetry={() => setReloadKey((n) => n + 1)}
          />
        ) : activeTab === 'artists' ? (
          <DirectoryArtistsBrowser
            artists={artists}
            loading={artistsLoading}
            liveIndicator="badge"
          />
        ) : null}

        {activeTab === 'venues' && <VenuesDirectory />}

        {selectedTrack && (
          <DiscoverWaveformPlayer
            selection={selectedTrack}
            onClose={() => setSelectedTrack(null)}
          />
        )}
      </ViewShell>
    </div>
  );
}
