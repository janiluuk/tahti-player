import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  AwardIcon,
  Blocks,
  ChevronDownIcon,
  ClockIcon,
  CompassIcon,
  Disc3Icon,
  FlameIcon,
  HeartIcon,
  ListMusicIcon,
  MapPinIcon,
  PauseIcon,
  PlayIcon,
  Plus,
  ShuffleIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  FilterChips,
  Popover,
  Select,
  TabLabel,
  Tabs,
  Tooltip,
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
import { WidgetCard } from '../components/discover/WidgetCard';
import { DiscoverGatewayBackground } from '../components/DiscoverGatewayBackground';
import { NewsFeedWidget } from '../components/NewsFeedWidget';
import { PageError } from '../components/PageStates';
import { WaveformSeekbar } from '../components/tahti/WaveformSeekbar';
import { VenuesDirectory } from '../components/VenuesDirectory';
import { CONTENT_TYPES } from '../content/contentTypes';
import { hasAccountRole } from '../lib/accountRoles';
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

const ALL_FILTER_ID = '__all__';

/** A multi-select filter with an "All" chip: picking All clears every
 * specific choice; picking a specific one leaves All. */
export function allOrSpecific(
  selected: string[],
  previous: string[],
): string[] {
  const pickedAll = selected.includes(ALL_FILTER_ID) && previous.length > 0;
  return pickedAll ? [] : selected.filter((id) => id !== ALL_FILTER_ID);
}

function apiReason(meta: FetchMeta): string | null {
  return meta.source === 'api' ? (meta.reason ?? null) : null;
}

const WIDGET_LABELS: Record<DiscoverWidgetId, string> = {
  'this-week-most-played': 'This week: most played',
  'this-week-least-played': 'This week: least played',
  'new-to-you': 'New to you',
  'latest-tracks': 'Latest tracks',
  'most-played': 'Most played',
  loved: 'Loved by the community',
  'artist-of-the-week': 'Random artist of the week',
  'random-artist': 'Random artist pick',
  'public-playlists': 'Public playlists',
  'tahti-selects': 'Tahti Selects',
  'latest-releases': 'Latest releases',
};

/** What each widget shows, for the Add a widget menu. */
const WIDGET_MENU: Record<
  DiscoverWidgetId,
  { icon: typeof CompassIcon; description: string }
> = {
  'this-week-most-played': {
    icon: TrendingUpIcon,
    description: 'The week’s most played tracks',
  },
  'this-week-least-played': {
    icon: TrendingDownIcon,
    description: 'Overlooked tracks from this week',
  },
  'new-to-you': {
    icon: SparklesIcon,
    description: 'Tracks you have not played yet',
  },
  'latest-tracks': { icon: ClockIcon, description: 'Fresh uploads' },
  'most-played': { icon: FlameIcon, description: 'All-time favourites' },
  loved: { icon: HeartIcon, description: 'What listeners love most' },
  'artist-of-the-week': {
    icon: StarIcon,
    description: 'One artist in the spotlight',
  },
  'random-artist': { icon: ShuffleIcon, description: 'Meet someone new' },
  'public-playlists': {
    icon: ListMusicIcon,
    description: 'Playlists shared by listeners',
  },
  'tahti-selects': { icon: AwardIcon, description: 'Hand-picked by Tahti' },
  'latest-releases': { icon: Disc3Icon, description: 'New albums and EPs' },
};

const TOP_LIST_WIDGET_IDS = new Set<DiscoverWidgetId>([
  'this-week-most-played',
  'this-week-least-played',
  'most-played',
]);

type WidgetData = {
  loading: boolean;
  error?: string | null;
  items: DiscoverTrackItem[];
  collections?: DiscoverCollection[];
  releases?: LatestRelease[];
  subtitle?: string;
  artist?: DiscoverArtistOfWeek;
};

type DiscoverSelection = {
  item: DiscoverTrackItem;
  playable: TahtiPlayable;
};

const DISCOVER_TABS: Array<{
  id: DiscoverTab;
  label: string;
  icon: typeof CompassIcon;
}> = [
  { id: 'discover', label: 'Discover', icon: CompassIcon },
  { id: 'artists', label: 'Artists', icon: UsersIcon },
  { id: 'venues', label: 'Venues', icon: MapPinIcon },
];

export function DiscoverView() {
  const enabledWidgets = useDiscoverStore((s) => s.enabledWidgets);
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
  const newsInstances = useListenerWidgetsStore((s) => s.instances);
  const newsFeeds = newsWidgetsOn(newsInstances, 'discover');
  const removeNewsFeed = useListenerWidgetsStore((s) => s.removeInstance);
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
  }, [enabledWidgets, filters, randomArtistRotationDays, reloadKey]);

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
        <Tabs.List>
          {DISCOVER_TABS.map((item) => (
            <Tabs.Tab key={item.id}>
              <span data-testid={`discover-tab-${item.id}`}>
                <TabLabel icon={<item.icon size={14} />}>{item.label}</TabLabel>
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <ViewShell
        title="Discover"
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
              Register a venue
            </Link>
            {user ? (
              <Link
                to="/venues/mine"
                className="text-sm font-medium underline-offset-2 hover:underline"
              >
                My venues
              </Link>
            ) : null}
          </header>
        ) : null}

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
                Genres{genreFilter.length > 0 ? ` (${genreFilter.length})` : ''}
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
                Types
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
                aria-label="Genres"
                multiple
                items={[
                  { id: ALL_FILTER_ID, label: 'All' },
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
                aria-label="Content types"
                multiple
                items={[{ id: ALL_FILTER_ID, label: 'All' }, ...CONTENT_TYPES]}
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
          <div className="mb-4 flex flex-col gap-4">
            {newsFeeds.map((instance) => (
              <NewsFeedWidget
                key={instance.id}
                instance={instance}
                onRemove={() => removeNewsFeed(instance.id)}
              />
            ))}
          </div>
        ) : null}

        {activeTab === 'discover' && enabledWidgets.length > 0 && (
          <div
            className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"
            data-testid="discover-widget-columns"
          >
            {enabledWidgets.map((id, index) => {
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
                    title={WIDGET_LABELS[id]}
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
                        ? 'No community-loved tracks yet.'
                        : id === 'public-playlists'
                          ? 'No public playlists match these filters yet.'
                          : id === 'tahti-selects'
                            ? 'No tracks in the Tahti Selects rotation right now.'
                            : id === 'latest-releases'
                              ? 'No releases published yet.'
                              : 'Nothing here yet.'
                    }
                    canMoveUp={index > 0}
                    canMoveDown={index < enabledWidgets.length - 1}
                    onMove={moveWidget}
                    onRemove={removeWidget}
                    isAdmin={isAdmin}
                    onSelectTrack={(track) => void selectTrack(track)}
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
          </div>
        )}

        {activeTab === 'artists' && artistsError && artists.length === 0 ? (
          <PageError
            title="Could not load the artist directory"
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

function DiscoverAddWidgetButton({
  availableToAdd,
  onAdd,
}: {
  availableToAdd: DiscoverWidgetId[];
  onAdd: (id: DiscoverWidgetId) => void;
}) {
  if (availableToAdd.length === 0) {
    return null;
  }

  return (
    <Popover
      anchor="bottom end"
      tooltip={{ content: 'Add a widget', side: 'top' }}
      trigger={
        <Button
          size="icon"
          variant="secondary"
          aria-label="Add a widget"
          data-testid="discover-add-widget"
        >
          <Plus size={17} aria-hidden />
          <Blocks size={15} aria-hidden />
        </Button>
      }
      panelClassName="w-72 px-1"
    >
      <Popover.Menu>
        {availableToAdd.map((id) => {
          const { icon: Icon, description } = WIDGET_MENU[id];
          return (
            <Popover.Item
              key={id}
              closeOnClick
              onClick={() => onAdd(id)}
              icon={<Icon size={16} aria-hidden />}
              className="rounded-md"
            >
              <span className="flex flex-col">
                <span className="font-semibold">{WIDGET_LABELS[id]}</span>
                <span className="text-xs opacity-80">{description}</span>
              </span>
            </Popover.Item>
          );
        })}
      </Popover.Menu>
    </Popover>
  );
}

function DiscoverWaveformPlayer({
  selection,
  onClose,
}: {
  selection: DiscoverSelection;
  onClose: () => void;
}) {
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const currentPeaks = usePlayerStore((state) => state.currentPeaks);
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const isCurrent = currentId === selection.playable.id;
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');
  const progress = isCurrent && duration > 0 ? currentTime / duration : 0;
  const peaks = (isCurrent ? currentPeaks : null) ?? selection.playable.peaks;

  return (
    <section
      className="border-border bg-background-secondary rounded-md border p-4 shadow-sm"
      aria-label="Waveform player"
    >
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="text"
          size="flexible"
          className="bg-foreground text-background hover:bg-foreground/90 flex size-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
          onClick={() => {
            if (isCurrent) {
              setStatus(isPlaying ? 'paused' : 'playing');
            } else {
              play(selection.playable);
            }
          }}
          aria-label={
            isPlaying ? 'Pause selected track' : 'Play selected track'
          }
        >
          {isPlaying ? <PauseIcon size={17} /> : <PlayIcon size={17} />}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {selection.playable.title}
          </p>
          <p className="text-foreground-secondary truncate text-xs">
            {selection.playable.artist}
          </p>
          <WaveformSeekbar
            trackId={selection.playable.id}
            progress={progress}
            peaks={peaks}
            label={selection.playable.title}
            durationSec={isCurrent ? duration : undefined}
            className="mt-3 h-9 w-full"
            onSeek={
              isCurrent && duration > 0
                ? (fraction) => seekTo(fraction * duration)
                : undefined
            }
          />
        </div>
        <Tooltip
          content="Close waveform player"
          side="top"
          wrapperClassName="shrink-0"
        >
          <Button
            type="button"
            variant="text"
            size="icon-sm"
            className="text-foreground-secondary hover:text-foreground shrink-0"
            onClick={onClose}
            aria-label="Close waveform player"
          >
            <XIcon size={16} />
          </Button>
        </Tooltip>
      </div>
    </section>
  );
}
