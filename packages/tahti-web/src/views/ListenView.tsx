import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  HeartIcon,
  HistoryIcon,
  ListMusicIcon,
  PauseIcon,
  PlayIcon,
  RadioIcon,
  RadioTowerIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardGrid,
  FilterChips,
  Input,
  SectionShell,
} from '@tahti-player/ui';

import { resolvePublicVisualizerPreset } from '../api/channel-design';
import {
  fetchArtistPlayables,
  fetchChannel,
  fetchDirectory,
  fetchEnabledInternetRadioPresets,
  fetchOnAirChannels,
  fetchRadioStation,
  TAHTI_RADIO_SLUG,
  type EnabledInternetRadioPreset,
} from '../api/client';
import {
  fetchDiscoverDiscoWidgets,
  fetchHomepageDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../api/disco-widgets';
import {
  isDirectoryArtistActive,
  type ChannelDirectoryItem,
  type OnAirChannel,
  type PublicChannel,
  type TahtiPlayable,
} from '../api/types';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { ListenerWidgetsSection } from '../components/ListenerWidgetsSection';
import { ListenWidgetStoreDialog } from '../components/ListenWidgetStoreDialog';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { QueueConfirmDialog } from '../components/QueueConfirmDialog';
import { RadioStationCoverEditButton } from '../components/RadioStationCover';
import { activeListenTab } from '../lib/navigationActive';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { FavoritesView } from './FavoritesView';
import { FeedView } from './FeedView';
import { HistoryView } from './HistoryView';

export type ListenTab = 'listen' | 'feed' | 'favorites' | 'history';

// 'dj'/'producer'/'band' match the artist's self-selected roles
// (ARTIST_ROLE_OPTIONS in views/settings/SettingsPanels.tsx); 'radio-host'
// is computed instead — see ChannelDirectoryItem.hasActiveShows.
const ARTIST_TYPE_OPTIONS = [
  { id: 'dj', label: 'DJ' },
  { id: 'producer', label: 'Producer' },
  { id: 'band', label: 'Band' },
  { id: 'radio-host', label: 'Radio host' },
] as const;

export function ListenView({ tab: tabProp = 'listen' }: { tab?: ListenTab }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const tab = activeListenTab(pathname) ?? tabProp;
  const [items, setItems] = useState<ChannelDirectoryItem[]>([]);
  const [onAir, setOnAir] = useState<OnAirChannel[]>([]);
  const [radio, setRadio] = useState<PublicChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [artistType, setArtistType] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [radioPresets, setRadioPresets] = useState<
    EnabledInternetRadioPreset[]
  >([]);
  const [queueConfirm, setQueueConfirm] = useState<{
    displayName: string;
    playables: TahtiPlayable[];
  } | null>(null);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const favoriteChannels = useLibraryStore((s) => s.favoriteChannels);
  const lastPlayed = useLibraryStore((s) => s.history[0] ?? null);
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchDirectory(),
      fetchOnAirChannels(),
      fetchRadioStation().catch(() => null),
      fetchEnabledInternetRadioPresets(),
    ]).then(([dir, channels, station, presets]) => {
      if (cancelled) {
        return;
      }
      setItems(dir.data.items);
      const liveSlugs = new Set(
        channels.data.live.map((channel) => channel.slug),
      );
      setOnAir(
        [...channels.data.live, ...channels.data.replaying]
          .filter((channel) => channel.slug !== TAHTI_RADIO_SLUG)
          .map((channel) => ({
            ...channel,
            state: liveSlugs.has(channel.slug) ? 'LIVE' : 'REPLAY',
          })),
      );
      setRadio(station?.data ?? null);
      setRadioPresets(presets.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchHomepageDiscoWidgets().then((home) => {
      if (cancelled) {
        return;
      }
      if (!signedIn) {
        setDiscoWidgets(home.data);
        return;
      }
      void fetchDiscoverDiscoWidgets().then((mine) => {
        if (cancelled) {
          return;
        }
        const seen = new Set(mine.data.map((w) => w.installId));
        setDiscoWidgets([
          ...mine.data,
          ...home.data.filter((w) => !seen.has(w.installId)),
        ]);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of items) {
      for (const g of ch.genres) {
        const key = g.trim();
        if (!key) {
          continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((ch) => {
        if (activeOnly && !isDirectoryArtistActive(ch)) {
          return false;
        }
        if (
          genre !== 'all' &&
          !ch.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
        ) {
          return false;
        }
        if (artistType === 'radio-host' && !ch.hasActiveShows) {
          return false;
        }
        if (
          artistType !== 'all' &&
          artistType !== 'radio-host' &&
          !(ch.artistRoles ?? []).includes(artistType)
        ) {
          return false;
        }
        if (!q) {
          return true;
        }
        return (
          ch.displayName.toLowerCase().includes(q) ||
          ch.username.toLowerCase().includes(q) ||
          ch.genres.some((g) => g.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const aActive = isDirectoryArtistActive(a);
        const bActive = isDirectoryArtistActive(b);
        if (aActive !== bActive) {
          return aActive ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      });
  }, [items, query, genre, artistType, activeOnly]);

  const playNow = async (slug: string) => {
    const { playable } = await fetchChannel(slug);
    if (playable) {
      play(playable);
    }
  };

  const playArtist = async (username: string) => {
    const { data } = await fetchArtistPlayables(username);
    const [first, ...rest] = data;
    if (first) {
      play(first, { enqueueRest: rest });
    }
  };

  const queueArtist = async (username: string, displayName: string) => {
    const { data } = await fetchArtistPlayables(username);
    if (data.length === 0) {
      return;
    }
    if (data.length > 1) {
      setQueueConfirm({ displayName, playables: data });
      return;
    }
    enqueue(data[0]);
  };

  const chipItems = useMemo(
    () => [
      { id: 'all', label: `All (${items.length})` },
      ...genres.map((g) => ({ id: g.name, label: `${g.name} (${g.count})` })),
    ],
    [genres, items.length],
  );

  const artistTypeChipItems = useMemo(
    () => [
      { id: 'all', label: `All types` },
      ...ARTIST_TYPE_OPTIONS.map((option) => ({
        id: option.id,
        label: `${option.label} (${
          option.id === 'radio-host'
            ? items.filter((ch) => ch.hasActiveShows).length
            : items.filter((ch) => (ch.artistRoles ?? []).includes(option.id))
                .length
        })`,
      })),
    ],
    [items],
  );

  const activeFilterCount =
    (genre !== 'all' ? 1 : 0) + (artistType !== 'all' ? 1 : 0);

  const radioLogo =
    radio?.user.avatarUrl ?? radio?.nowPlaying?.artworkUrl ?? null;
  const radioName = radio?.user.displayName ?? 'Tahti Radio';
  const radioPlayableId = `radio:${TAHTI_RADIO_SLUG}`;
  const radioIsCurrent = currentId === radioPlayableId;
  const radioIsPlaying =
    radioIsCurrent &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');

  const toggleRadioPlayback = () => {
    if (radioIsCurrent) {
      setPlaybackStatus(radioIsPlaying ? 'paused' : 'playing');
      return;
    }

    void fetchRadioStation().then(({ playable }) => {
      if (playable) {
        play(playable);
      }
    });
  };

  return (
    <>
      <PageFrame>
        <PageHeader
          title="Listen"
          subtitle={
            signedIn
              ? 'Discover community artists — your library is one tab over.'
              : 'Discover Tahti artists. Sign in to see your library here.'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {signedIn ? <ListenWidgetStoreDialog /> : null}
              {!signedIn ? (
                <Link to="/what-is-it">
                  <Button size="sm" variant="secondary">
                    What is tahti.live?
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        />

        <nav
          aria-label="Listen sections"
          className="border-border flex w-full gap-1 overflow-x-auto border-b"
          role="tablist"
        >
          {(
            [
              ['listen', 'Listen', ListMusicIcon, '/'],
              ['feed', 'Feed', ListMusicIcon, '/listen/feed'],
              ['favorites', 'Favorites', HeartIcon, '/listen/favorites'],
              ['history', 'History', HistoryIcon, '/listen/history'],
            ] as const
          ).map(([id, label, Icon, to]) => (
            <Link
              key={id}
              to={to}
              role="tab"
              aria-selected={tab === id}
              className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === id
                  ? 'border-primary text-foreground'
                  : 'text-foreground-secondary hover:text-foreground border-transparent'
              }`}
            >
              <Icon size={14} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        {tab === 'feed' ? <FeedView embedded /> : null}
        {tab === 'favorites' ? <FavoritesView embedded /> : null}
        {tab === 'history' ? <HistoryView embedded /> : null}

        {tab === 'listen' ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {lastPlayed ? (
                <div className="sm:min-w-0 sm:flex-1">
                  <SectionShell title="Continue listening">
                    <CardGrid>
                      <Card
                        title={lastPlayed.playable.title}
                        subtitle={lastPlayed.playable.artist}
                        src={
                          lastPlayed.playable.coverUrl ??
                          placeholderArtworkUrl(lastPlayed.playable.id)
                        }
                        onPlay={() => play(lastPlayed.playable)}
                      />
                    </CardGrid>
                  </SectionShell>
                </div>
              ) : null}
              <div className="sm:min-w-0 sm:flex-1">
                <ListenerWidgetsSection />
              </div>
            </div>

            <DiscoWidgetsSection widgets={discoWidgets} />

            {radio ? (
              <Box
                variant="secondary"
                className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden"
              >
                {radioIsPlaying ? (
                  <div className="pointer-events-none absolute inset-0 opacity-45">
                    <ChannelVisualizer
                      preset={resolvePublicVisualizerPreset(radio.visualPreset)}
                      colorScheme={radio.colorScheme}
                      colorSchemeJson={radio.colorSchemeJson}
                      visualSettingsJson={radio.visualSettingsJson}
                      artworkUrl={radio.nowPlaying?.artworkUrl ?? undefined}
                      className="h-full min-h-28 w-full"
                    />
                  </div>
                ) : null}
                <div className="relative z-10 flex min-w-0 items-start gap-3">
                  <div className="bg-surface-secondary flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold tracking-tight">
                    {radioLogo ? (
                      <img
                        src={radioLogo}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <RadioIcon
                        size={20}
                        className="text-foreground-secondary"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold tracking-tight">
                      {radioName}
                    </div>
                    <p className="text-foreground-secondary text-xs">
                      {radio.hlsUrl
                        ? (radio.nowPlaying?.title ?? '24/7 community stream')
                        : 'Temporarily offline'}
                      {radio.nowPlaying?.artistName
                        ? ` · ${radio.nowPlaying.artistName}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-2">
                  <Button
                    size="icon-sm"
                    disabled={!radio.hlsUrl}
                    title={radioIsPlaying ? 'Pause Radio' : 'Play Radio'}
                    aria-label={radioIsPlaying ? 'Pause Radio' : 'Play Radio'}
                    aria-pressed={radioIsPlaying}
                    onClick={toggleRadioPlayback}
                  >
                    {radioIsPlaying ? (
                      <PauseIcon size={16} className="fill-current" />
                    ) : (
                      <PlayIcon size={16} className="fill-current" />
                    )}
                  </Button>
                  <Link to="/radio">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      title="Open radio"
                      aria-label="Open radio"
                    >
                      <RadioTowerIcon size={16} aria-hidden />
                    </Button>
                  </Link>
                </div>
              </Box>
            ) : null}

            {radioPresets.length > 0 ? (
              <SectionShell title="Radio">
                <CardGrid>
                  {radioPresets.map((preset) => {
                    const playableId = `radio-preset:${preset.id}`;
                    const isCurrent = currentId === playableId;
                    const isPlaying =
                      isCurrent &&
                      (playbackStatus === 'playing' ||
                        playbackStatus === 'loading');
                    return (
                      <div key={preset.id} className="group relative w-fit">
                        <RadioStationCoverEditButton
                          label={preset.name}
                          stationName={preset.name}
                          presetId={preset.id}
                          className="absolute top-3 left-3 z-10 rounded-full"
                          onCoverChange={(iconUrl) =>
                            setRadioPresets((current) =>
                              current.map((item) =>
                                item.id === preset.id
                                  ? { ...item, iconUrl }
                                  : item,
                              ),
                            )
                          }
                        />
                        <Card
                          title={preset.name}
                          subtitle={preset.genre ?? 'Internet radio'}
                          src={
                            preset.iconUrl ?? placeholderArtworkUrl(playableId)
                          }
                          isPlaying={isPlaying}
                          playDisabled={!preset.streamUrl}
                          onPlay={() => {
                            if (!preset.streamUrl) {
                              return;
                            }
                            if (isCurrent) {
                              setPlaybackStatus(
                                isPlaying ? 'paused' : 'playing',
                              );
                              return;
                            }
                            play({
                              id: playableId,
                              kind: 'radio',
                              title: preset.name,
                              artist: preset.genre ?? 'Internet radio',
                              coverUrl: preset.iconUrl ?? undefined,
                              streamUrl: preset.streamUrl,
                              protocol: 'https',
                              sourceProvider: 'internet-radio',
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </CardGrid>
              </SectionShell>
            ) : null}

            {onAir.length > 0 ? (
              <SectionShell title="On air">
                <CardGrid>
                  {onAir.map((channel) => {
                    const channelIsCurrent =
                      currentId === `live:${channel.slug}`;
                    const channelIsPlaying =
                      channelIsCurrent &&
                      (playbackStatus === 'playing' ||
                        playbackStatus === 'loading');
                    return (
                      <Card
                        key={channel.slug}
                        title={
                          <Link
                            to="/channel/$slug"
                            params={{ slug: channel.slug }}
                            className="hover:underline"
                          >
                            {channel.user.displayName}
                          </Link>
                        }
                        subtitle={
                          <span className="font-semibold">
                            {channelIsPlaying
                              ? 'Playing now'
                              : channel.state === 'LIVE'
                                ? 'Live now'
                                : 'Replay'}
                          </span>
                        }
                        src={
                          channel.user.avatarUrl ??
                          placeholderArtworkUrl(channel.slug)
                        }
                        isPlaying={channelIsPlaying}
                        onPlay={() => {
                          if (channelIsCurrent) {
                            setPlaybackStatus(
                              channelIsPlaying ? 'paused' : 'playing',
                            );
                            return;
                          }
                          void playNow(channel.slug);
                        }}
                        onClick={() => {
                          void navigate({
                            to: '/channel/$slug',
                            params: { slug: channel.slug },
                          });
                        }}
                      />
                    );
                  })}
                </CardGrid>
              </SectionShell>
            ) : null}

            <SectionShell title={signedIn ? 'Discover artists' : 'Artists'}>
              <div className="flex flex-col gap-4">
                <div className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      label="Search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Artist name, username, genre…"
                      className="min-w-48 flex-1"
                    />
                    <button
                      type="button"
                      aria-pressed={activeOnly}
                      onClick={() => setActiveOnly((prev) => !prev)}
                      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        activeOnly
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border text-foreground hover:bg-foreground/10 bg-transparent'
                      }`}
                    >
                      Active now ({items.filter(isDirectoryArtistActive).length}
                      )
                    </button>
                    <button
                      type="button"
                      aria-expanded={filtersExpanded}
                      onClick={() => setFiltersExpanded((prev) => !prev)}
                      className="border-border text-foreground-secondary hover:text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors"
                    >
                      <SlidersHorizontalIcon size={14} aria-hidden />
                      Filters
                      {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                      <ChevronDownIcon
                        size={14}
                        aria-hidden
                        className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {genres.length > 0 && (
                      <FilterChips
                        items={chipItems}
                        selected={genre}
                        onChange={setGenre}
                      />
                    )}
                  </div>

                  {filtersExpanded && (
                    <div className="border-border flex flex-col gap-3 border-t pt-3">
                      <div>
                        <p className="text-foreground-secondary mb-1.5 text-xs font-semibold tracking-wide uppercase">
                          Artist type
                        </p>
                        <FilterChips
                          items={artistTypeChipItems}
                          selected={artistType}
                          onChange={setArtistType}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-foreground-secondary text-xs">
                    Showing {filtered.length} of {items.length} artists
                  </p>
                </div>

                {loading ? (
                  <PageLoading label="Loading artists…" />
                ) : filtered.length === 0 ? (
                  <PageEmpty
                    title="No artists match"
                    description={`${query ? `“${query}”` : 'Try another filter'}${genre !== 'all' ? ` in ${genre}` : ''}.`}
                  />
                ) : (
                  <CardGrid>
                    {filtered.map((ch) => {
                      const favorited =
                        signedIn &&
                        favoriteChannels.some((c) => c.slug === ch.slug);
                      return (
                        <Card
                          key={ch.slug}
                          title={
                            <Link
                              to="/u/$username"
                              params={{ username: ch.username }}
                              className="hover:underline"
                            >
                              {ch.displayName}
                            </Link>
                          }
                          subtitle={
                            <span className="font-mono">
                              {isDirectoryArtistActive(ch) ? 'Active · ' : ''}
                              {ch.genres.slice(0, 2).join(', ') ||
                                `@${ch.username}`}
                            </span>
                          }
                          src={
                            ch.avatarUrl ?? placeholderArtworkUrl(ch.username)
                          }
                          onPlay={() => void playArtist(ch.username)}
                          onQueue={() =>
                            void queueArtist(ch.username, ch.displayName)
                          }
                          onFavorite={
                            signedIn
                              ? () =>
                                  toggleFavoriteChannel({
                                    slug: ch.slug,
                                    displayName: ch.displayName,
                                    avatarUrl: ch.avatarUrl,
                                  })
                              : undefined
                          }
                          favorited={favorited}
                          onClick={() => {
                            void navigate({
                              to: '/u/$username',
                              params: { username: ch.username },
                            });
                          }}
                        />
                      );
                    })}
                  </CardGrid>
                )}
              </div>
            </SectionShell>
          </>
        ) : null}
      </PageFrame>

      <QueueConfirmDialog
        isOpen={Boolean(queueConfirm)}
        count={queueConfirm?.playables.length ?? 0}
        sourceLabel={queueConfirm?.displayName ?? ''}
        onCancel={() => setQueueConfirm(null)}
        onConfirm={() => {
          if (queueConfirm) {
            for (const item of queueConfirm.playables) {
              enqueue(item);
            }
          }
          setQueueConfirm(null);
        }}
      />
    </>
  );
}
