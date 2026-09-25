import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { HistoryIcon, ListMusicIcon, NewspaperIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardsRow,
  TabLabel,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchChannel,
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
import { fetchLatestTracks } from '../api/discover';
import { readIcyStreamTitle } from '../api/radio-sources';
import type { OnAirChannel, PublicChannel, TahtiPlayable } from '../api/types';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { ListenerWidgetsSection } from '../components/ListenerWidgetsSection';
import { ListenWidgetStoreDialog } from '../components/ListenWidgetStoreDialog';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { RadioListItem } from '../components/RadioListItem';
import { RadioStationCoverEditButton } from '../components/RadioStationCover';
import { RemoveWidgetDialog } from '../components/RemoveWidgetDialog';
import {
  RADIO_STATIONS,
  radioStation,
  radioStationPlayable,
  type RadioStation,
} from '../content/radioStations';
import { usePolling } from '../hooks/usePolling';
import { discoverTrackPlayable } from '../lib/discoverTrackPlayable';
import { resolveLocalPlayableForReplay } from '../lib/nativeLibrary';
import { activeListenTab } from '../lib/navigationActive';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';
import { FeedView } from './FeedView';
import { HistoryView } from './HistoryView';

export type ListenTab = 'listen' | 'feed' | 'history';

const LISTEN_SECTION_TABS = [
  { id: 'listen' as const, label: 'Listen', Icon: ListMusicIcon, to: '/' },
  {
    id: 'feed' as const,
    label: 'Feed',
    Icon: NewspaperIcon,
    to: '/listen/feed',
  },
  {
    id: 'history' as const,
    label: 'History',
    Icon: HistoryIcon,
    to: '/listen/history',
  },
];

const NOW_PLAYING_POLL_MS = 45_000;
const RECENTLY_PLAYED_LIMIT = 20;
const LATEST_TRACKS_LIMIT = 25;

const ROW_LABELS = {
  filterPlaceholder: 'Filter…',
  nothingFound: 'Nothing matches that filter.',
};

type RadioRowItem =
  | {
      id: string;
      title: string;
      kind: 'preset';
      preset: EnabledInternetRadioPreset;
    }
  | { id: string; title: string; kind: 'catalog'; station: RadioStation };

type OnAirRowItem = { id: string; title: string; channel: OnAirChannel };

type RecentRowItem = { id: string; title: string; playable: TahtiPlayable };

export function ListenView({ tab: tabProp = 'listen' }: { tab?: ListenTab }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const tab = activeListenTab(pathname) ?? tabProp;
  const [onAir, setOnAir] = useState<OnAirChannel[]>([]);
  const [radio, setRadio] = useState<PublicChannel | null>(null);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [radioPresets, setRadioPresets] = useState<
    EnabledInternetRadioPreset[]
  >([]);
  const [presetNowPlaying, setPresetNowPlaying] = useState<
    Record<string, string>
  >({});
  const [latestTracks, setLatestTracks] = useState<TahtiPlayable[]>([]);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const history = useLibraryStore((s) => s.history);
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);
  const enabledStationIds = useListenerWidgetsStore((s) => s.enabledStationIds);
  const stationOverrides = useListenerWidgetsStore((s) => s.stationOverrides);
  const toggleStation = useListenerWidgetsStore((s) => s.toggleStation);
  const [pendingStationRemoval, setPendingStationRemoval] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const nowPlayingRefreshInFlight = useRef(false);

  // The reference dashboard keeps the queue docked on the right. Only take
  // over the rail when it would otherwise show the empty "Chat unavailable"
  // state, so an active channel chat or the notifications tab is never hidden.
  useEffect(() => {
    if (tab !== 'listen') {
      return;
    }
    const layout = useLayoutStore.getState();
    if (layout.rightRailTab === 'chat' && !layout.chatEnabled) {
      layout.setRightRailTab('queue');
    }
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    void fetchOnAirChannels()
      .then((channels) => {
        if (!cancelled) {
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
        }
      })
      .catch(() => undefined);
    void fetchRadioStation()
      .then((station) => {
        if (!cancelled) {
          setRadio(station.data);
        }
      })
      .catch(() => undefined);
    void fetchEnabledInternetRadioPresets()
      .then((presets) => {
        if (!cancelled) {
          setRadioPresets(presets.data);
        }
      })
      .catch(() => undefined);
    void fetchLatestTracks({ genres: [], contentTypes: [] }).then(
      ({ data }) => {
        if (cancelled) {
          return;
        }
        setLatestTracks(
          data
            .map(discoverTrackPlayable)
            .filter((item): item is TahtiPlayable => item !== null)
            .slice(0, LATEST_TRACKS_LIMIT),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPresetNowPlaying = useCallback(async () => {
    if (radioPresets.length === 0 || nowPlayingRefreshInFlight.current) {
      return;
    }
    nowPlayingRefreshInFlight.current = true;
    try {
      const entries = await Promise.all(
        radioPresets.map(async (preset) => {
          if (!preset.streamUrl) {
            return [preset.id, null] as const;
          }
          const title = await readIcyStreamTitle(preset.streamUrl);
          return [preset.id, title] as const;
        }),
      );
      const next: Record<string, string> = {};
      for (const [id, title] of entries) {
        if (title) {
          next[id] = title;
        }
      }
      setPresetNowPlaying(next);
    } catch {
      return;
    } finally {
      nowPlayingRefreshInFlight.current = false;
    }
  }, [radioPresets]);

  useEffect(() => {
    void refreshPresetNowPlaying();
  }, [refreshPresetNowPlaying]);

  usePolling(
    () => void refreshPresetNowPlaying(),
    NOW_PLAYING_POLL_MS,
    radioPresets.length > 0,
  );

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

  const playNow = async (slug: string) => {
    const { playable } = await fetchChannel(slug);
    if (playable) {
      play(playable);
    }
  };

  const isActive = (playableId: string) =>
    currentId === playableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');

  const togglePlayback = (playableId: string, start: () => void) => {
    if (currentId === playableId) {
      setPlaybackStatus(isActive(playableId) ? 'paused' : 'playing');
      return;
    }
    start();
  };

  const radioLogo =
    radio?.user.avatarUrl ?? radio?.nowPlaying?.artworkUrl ?? null;
  const radioName = radio?.user.displayName ?? 'Tahti Radio';
  const radioPlayableId = `radio:${TAHTI_RADIO_SLUG}`;

  const toggleRadioPlayback = () =>
    togglePlayback(radioPlayableId, () => {
      void fetchRadioStation().then(({ playable }) => {
        if (playable) {
          play(playable);
        }
      });
    });

  const replayFromHistory = (playable: TahtiPlayable) =>
    togglePlayback(playable.id, () => {
      resolveLocalPlayableForReplay(playable)
        .then((resolved) => {
          if (resolved) {
            play(resolved);
          } else {
            toast.error(
              'Re-import this file from your library to play it again.',
            );
          }
        })
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : 'Track unavailable.',
          );
        });
    });

  // Catalog stations (packages/tahti-web/src/content/radioStations.ts) fill
  // in any station that doesn't already have a board-curated preset enabled
  // for it (matched by name, same link used above for cover editing) — the
  // preset's admin-uploaded artwork wins when both exist for the same station.
  const radioItems = useMemo<RadioRowItem[]>(() => {
    const presetNames = new Set(radioPresets.map((preset) => preset.name));
    const catalog = enabledStationIds
      .map((id) => {
        const station = radioStation(id);
        return station ? { ...station, ...stationOverrides[id] } : undefined;
      })
      .filter((station) => station != null)
      .filter((station) => !presetNames.has(station.name));
    return [
      ...radioPresets.map((preset) => ({
        id: `radio-preset:${preset.id}`,
        title: preset.name,
        kind: 'preset' as const,
        preset,
      })),
      ...catalog.map((station) => ({
        id: `radio-widget:${station.id}`,
        title: station.name,
        kind: 'catalog' as const,
        station,
      })),
    ];
  }, [radioPresets, enabledStationIds, stationOverrides]);

  const onAirItems = useMemo<OnAirRowItem[]>(
    () =>
      onAir.map((channel) => ({
        id: channel.slug,
        title: channel.user.displayName,
        channel,
      })),
    [onAir],
  );

  const recentItems = useMemo<RecentRowItem[]>(
    () =>
      history.slice(0, RECENTLY_PLAYED_LIMIT).map((entry) => ({
        id: entry.playable.id,
        title: entry.playable.title,
        playable: entry.playable,
      })),
    [history],
  );

  const renderRadioItem = (item: RadioRowItem) => {
    if (item.kind === 'preset') {
      const { preset } = item;
      return (
        <div className="group relative w-fit">
          <RadioStationCoverEditButton
            label={preset.name}
            stationName={preset.name}
            catalogStationId={
              RADIO_STATIONS.find((station) => station.name === preset.name)?.id
            }
            presetId={preset.id}
            className="absolute top-3 left-3 z-10 rounded-full"
            onCoverChange={(iconUrl) =>
              setRadioPresets((current) =>
                current.map((entry) =>
                  entry.id === preset.id ? { ...entry, iconUrl } : entry,
                ),
              )
            }
          />
          <Card
            title={preset.name}
            subtitle={
              presetNowPlaying[preset.id] ?? preset.genre ?? 'Internet radio'
            }
            src={preset.iconUrl ?? placeholderArtworkUrl(item.id)}
            isPlaying={isActive(item.id)}
            playDisabled={!preset.streamUrl}
            onPlay={() => {
              const streamUrl = preset.streamUrl;
              if (!streamUrl) {
                return;
              }
              togglePlayback(item.id, () =>
                play({
                  id: item.id,
                  kind: 'radio',
                  title: presetNowPlaying[preset.id] ?? preset.name,
                  artist: preset.name,
                  coverUrl: preset.iconUrl ?? undefined,
                  streamUrl,
                  protocol: 'https',
                  sourceProvider: 'internet-radio',
                }),
              );
            }}
          />
        </div>
      );
    }
    const { station } = item;
    const streamUrl = station.streamUrl;
    return (
      <div className="group relative w-fit">
        <RadioStationCoverEditButton
          label={station.name}
          stationName={station.name}
          catalogStationId={station.id}
          className="absolute top-3 left-3 z-10 rounded-full"
        />
        <Tooltip content={`Remove ${station.name}`} side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Remove ${station.name}`}
            onClick={() =>
              setPendingStationRemoval({ id: station.id, label: station.name })
            }
            className="bg-background/80 hover:bg-background absolute top-1 right-1 z-10 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <XIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Card
          title={station.name}
          subtitle={`${station.language} · ${station.bitrateKbps}kbps`}
          src={station.logoUrl}
          isPlaying={isActive(item.id)}
          playLabel={streamUrl ? 'Play' : 'Stream pending'}
          playDisabled={!streamUrl}
          onPlay={
            streamUrl
              ? () =>
                  togglePlayback(item.id, () =>
                    play(radioStationPlayable({ ...station, streamUrl })),
                  )
              : undefined
          }
        />
      </div>
    );
  };

  const renderOnAirItem = ({ channel }: OnAirRowItem) => {
    const playableId = `live:${channel.slug}`;
    const playing = isActive(playableId);
    return (
      <Card
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
            {playing
              ? 'Playing now'
              : channel.state === 'LIVE'
                ? 'Live now'
                : 'Replay'}
          </span>
        }
        src={channel.user.avatarUrl ?? placeholderArtworkUrl(channel.slug)}
        isPlaying={playing}
        onPlay={() =>
          togglePlayback(playableId, () => void playNow(channel.slug))
        }
        onClick={() => {
          void navigate({
            to: '/channel/$slug',
            params: { slug: channel.slug },
          });
        }}
      />
    );
  };

  const renderRecentItem = ({ playable }: RecentRowItem) => (
    <Card
      title={playable.title}
      subtitle={playable.artist}
      src={playable.coverUrl ?? placeholderArtworkUrl(playable.id)}
      isPlaying={isActive(playable.id)}
      onPlay={() => replayFromHistory(playable)}
    />
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <Tabs.Root
        selectedIndex={Math.max(
          0,
          LISTEN_SECTION_TABS.findIndex((item) => item.id === tab),
        )}
        onChange={(index) => {
          const next = LISTEN_SECTION_TABS[index];
          if (next) {
            void navigate({ to: next.to });
          }
        }}
      >
        <Tabs.List aria-label="Listen sections" className="overflow-x-auto">
          {LISTEN_SECTION_TABS.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={<item.Icon size={14} />}>{item.label}</TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <ViewShell
        title={
          tab === 'feed' ? 'Feed' : tab === 'history' ? 'History' : 'Listen'
        }
        classes={{ root: 'px-0 pt-0' }}
        actions={
          tab === 'listen' && signedIn ? <ListenWidgetStoreDialog /> : undefined
        }
      >
        {tab === 'feed' ? <FeedView embedded /> : null}
        {tab === 'history' ? <HistoryView embedded /> : null}

        {tab === 'listen' ? (
          <div className="flex flex-col gap-4" data-testid="listen-dashboard">
            {radio ? (
              <RadioListItem
                name={radioName}
                coverUrl={radioLogo}
                subtitle={`${
                  radio.hlsUrl
                    ? (radio.nowPlaying?.title ?? '24/7 community stream')
                    : 'Temporarily offline'
                }${
                  radio.nowPlaying?.artistName
                    ? ` · ${radio.nowPlaying.artistName}`
                    : ''
                }`}
                isPlaying={isActive(radioPlayableId)}
                disabled={!radio.hlsUrl}
                onTogglePlay={toggleRadioPlayback}
                visualPreset={radio.visualPreset}
                colorScheme={radio.colorScheme}
                colorSchemeJson={radio.colorSchemeJson}
                visualSettingsJson={radio.visualSettingsJson}
              />
            ) : null}

            {recentItems.length > 0 ? (
              <CardsRow
                data-testid="listen-recently-played"
                title="Recently played"
                badge="History"
                items={recentItems}
                labels={{ ...ROW_LABELS, filterPlaceholder: 'Filter tracks…' }}
                renderItem={renderRecentItem}
              />
            ) : null}

            {radioItems.length > 0 ? (
              <CardsRow
                data-testid="listen-radio"
                title="Radio"
                badge="Internet radio"
                items={radioItems}
                labels={{
                  ...ROW_LABELS,
                  filterPlaceholder: 'Filter stations…',
                }}
                renderItem={renderRadioItem}
              />
            ) : null}

            {onAirItems.length > 0 ? (
              <CardsRow
                data-testid="listen-on-air"
                title="On air"
                badge="Live"
                items={onAirItems}
                labels={{
                  ...ROW_LABELS,
                  filterPlaceholder: 'Filter channels…',
                }}
                renderItem={renderOnAirItem}
              />
            ) : null}

            {latestTracks.length > 0 ? (
              <section
                className="flex flex-col gap-3"
                data-testid="listen-new-tracks"
              >
                <h2 className="text-foreground text-lg font-bold">
                  New tracks
                </h2>
                <PlayableTrackTable items={latestTracks} />
              </section>
            ) : null}

            <ListenerWidgetsSection />
            <DiscoWidgetsSection widgets={discoWidgets} />

            <RemoveWidgetDialog
              isOpen={pendingStationRemoval != null}
              label={pendingStationRemoval?.label ?? ''}
              onCancel={() => setPendingStationRemoval(null)}
              onConfirm={() => {
                if (pendingStationRemoval) {
                  toggleStation(pendingStationRemoval.id);
                }
                setPendingStationRemoval(null);
              }}
            />
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}
