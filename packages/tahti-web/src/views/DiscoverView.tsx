import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  Blocks,
  ChevronDownIcon,
  CompassIcon,
  MapPinIcon,
  PauseIcon,
  PlayIcon,
  Plus,
  SlidersHorizontalIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
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

import { fetchDirectory, fetchTrackDetail } from '../api/client';
import {
  fetchArtistOfTheWeek,
  fetchLatestTracks,
  fetchLovedTracks,
  fetchNewToYou,
  fetchPublicCollections,
  fetchRandomArtist,
  fetchTopTracks,
} from '../api/discover';
import type { DiscoverArtistOfWeek } from '../api/discover';
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
};

const TOP_LIST_WIDGET_IDS = new Set<DiscoverWidgetId>([
  'this-week-most-played',
  'this-week-least-played',
  'most-played',
]);

type WidgetData = {
  loading: boolean;
  items: DiscoverTrackItem[];
  collections?: DiscoverCollection[];
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
  const unheardOnly = useDiscoverStore((s) => s.unheardOnly);
  const addWidget = useDiscoverStore((s) => s.addWidget);
  const removeWidget = useDiscoverStore((s) => s.removeWidget);
  const moveWidget = useDiscoverStore((s) => s.moveWidget);
  const setGenreFilter = useDiscoverStore((s) => s.setGenreFilter);
  const setContentTypeFilter = useDiscoverStore((s) => s.setContentTypeFilter);
  const setUnheardOnly = useDiscoverStore((s) => s.setUnheardOnly);
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
  const [unheardIds, setUnheardIds] = useState<Set<string> | null>(null);
  const [genresOpen, setGenresOpen] = useState(false);
  const [contentTypesOpen, setContentTypesOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DiscoverSelection | null>(
    null,
  );
  const [artists, setArtists] = useState<ChannelDirectoryItem[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
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
        setArtistsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contentTypeFilter, genreFilter, randomArtistRotationDays, unheardOnly]);

  useEffect(() => {
    if (!unheardOnly) {
      setUnheardIds(null);
      return;
    }
    setUnheardIds(new Set());
    let cancelled = false;
    void fetchNewToYou().then((result) => {
      if (!cancelled) {
        setUnheardIds(new Set(result.data.map((track) => track.id)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [unheardOnly]);

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
            const { data: artist } = await fetchArtistOfTheWeek();
            return { loading: false, items: [], artist: artist ?? undefined };
          }
          case 'random-artist': {
            const { data: artist } = await fetchRandomArtist(
              randomArtistRotationDays,
            );
            return { loading: false, items: [], artist: artist ?? undefined };
          }
          case 'this-week-most-played': {
            const { data: items } = await fetchTopTracks(
              'week',
              'desc',
              filters,
            );
            return { loading: false, items };
          }
          case 'this-week-least-played': {
            const { data: items } = await fetchTopTracks(
              'week',
              'asc',
              filters,
            );
            return { loading: false, items };
          }
          case 'most-played': {
            const { data: items } = await fetchTopTracks(
              'all_time',
              'desc',
              filters,
            );
            return { loading: false, items };
          }
          case 'latest-tracks': {
            const { data: items } = await fetchLatestTracks(filters);
            return { loading: false, items };
          }
          case 'new-to-you': {
            const res = await fetchNewToYou();
            return {
              loading: false,
              items: res.data,
              subtitle: res.authenticated
                ? res.preferenceGenres.length > 0
                  ? `Based on ${res.preferenceGenres.join(', ')}`
                  : undefined
                : 'Sign in for picks based on your taste',
            };
          }
          case 'loved': {
            const { data: items } = await fetchLovedTracks(filters);
            return { loading: false, items };
          }
          case 'public-playlists': {
            const { data: collections } = await fetchPublicCollections(filters);
            return { loading: false, items: [], collections };
          }
        }
      };

      void load().then((result) => {
        if (!cancelled) {
          const filteredItems =
            unheardOnly && unheardIds
              ? result.items.filter((item) => unheardIds.has(item.id))
              : result.items;
          setData((prev) => ({
            ...prev,
            [id]: { ...result, items: filteredItems },
          }));
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [
    enabledWidgets,
    filters,
    unheardIds,
    unheardOnly,
    randomArtistRotationDays,
  ]);

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
    <div className="relative flex max-w-5xl flex-col gap-6">
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
      <ViewShell title="Discover" classes={{ root: 'px-0 pt-0' }}>
        <header className="mb-4 flex flex-wrap items-center gap-2">
          {activeTab === 'venues' ? (
            <Link
              to="/venues/register"
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              Register a venue
            </Link>
          ) : activeTab === 'discover' ? (
            <DiscoverAddWidgetButton
              availableToAdd={availableToAdd}
              onAdd={addWidget}
            />
          ) : null}
        </header>

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
              <FilterChips
                multiple
                items={[{ id: 'unheard', label: 'Tracks I haven’t heard' }]}
                selected={unheardOnly ? ['unheard'] : []}
                onChange={(selected) =>
                  setUnheardOnly(selected.includes('unheard'))
                }
              />
            </div>
            {genresOpen ? (
              <FilterChips
                multiple
                items={[
                  { id: ALL_FILTER_ID, label: 'All' },
                  ...PRESET_GENRES.map((g) => ({ id: g, label: g })),
                ]}
                selected={
                  genreFilter.length > 0 ? genreFilter : [ALL_FILTER_ID]
                }
                onChange={(selected) =>
                  setGenreFilter(selected.filter((id) => id !== ALL_FILTER_ID))
                }
              />
            ) : null}
            {contentTypesOpen ? (
              <FilterChips
                multiple
                items={[{ id: ALL_FILTER_ID, label: 'All' }, ...CONTENT_TYPES]}
                selected={
                  contentTypeFilter.length > 0
                    ? contentTypeFilter
                    : [ALL_FILTER_ID]
                }
                onChange={(selected) =>
                  setContentTypeFilter(
                    selected.filter((id) => id !== ALL_FILTER_ID),
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
            className="grid gap-4 lg:grid-cols-3"
            data-testid="discover-widget-columns"
          >
            {enabledWidgets.map((id, index) => {
              const widgetData = data[id];
              return (
                <WidgetCard
                  key={id}
                  id={id}
                  title={WIDGET_LABELS[id]}
                  subtitle={widgetData?.subtitle}
                  loading={widgetData?.loading ?? true}
                  items={widgetData?.items ?? []}
                  collections={widgetData?.collections}
                  artist={widgetData?.artist}
                  showRank={TOP_LIST_WIDGET_IDS.has(id)}
                  emptyMessage={
                    id === 'loved'
                      ? 'No community-loved tracks yet.'
                      : id === 'public-playlists'
                        ? 'No public playlists match these filters yet.'
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
              );
            })}
          </div>
        )}

        {activeTab === 'artists' ? (
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
      className="relative"
      anchor="bottom end"
      trigger={
        <Tooltip content="Add a widget" side="top">
          <Button
            size="icon"
            variant="secondary"
            aria-label="Add a widget"
            data-testid="discover-add-widget"
          >
            <Plus size={17} aria-hidden />
            <Blocks size={15} aria-hidden />
          </Button>
        </Tooltip>
      }
      panelClassName="w-56"
    >
      <Popover.Menu>
        {availableToAdd.map((id) => (
          <Popover.Item key={id} onClick={() => onAdd(id)}>
            {WIDGET_LABELS[id]}
          </Popover.Item>
        ))}
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
        <button
          type="button"
          className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
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
        </button>
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
            bars={peaks?.length || 64}
            className="mt-3 h-9 w-full"
            onSeek={
              isCurrent && duration > 0
                ? (fraction) => seekTo(fraction * duration)
                : undefined
            }
          />
        </div>
        <button
          type="button"
          className="text-foreground-secondary hover:text-foreground shrink-0 rounded p-1 transition-colors"
          onClick={onClose}
          aria-label="Close waveform player"
        >
          <XIcon size={16} />
        </button>
      </div>
    </section>
  );
}
