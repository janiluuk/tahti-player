import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { HistoryIcon, ListMusicIcon, NewspaperIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardGrid,
  SectionShell,
  TabLabel,
  Tabs,
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
import { readIcyStreamTitle } from '../api/radio-sources';
import type { OnAirChannel, PublicChannel } from '../api/types';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { ListenerWidgetsSection } from '../components/ListenerWidgetsSection';
import { ListenWidgetStoreDialog } from '../components/ListenWidgetStoreDialog';
import { RadioListItem } from '../components/RadioListItem';
import { RadioStationCoverEditButton } from '../components/RadioStationCover';
import { RADIO_STATIONS } from '../content/radioStations';
import { activeListenTab } from '../lib/navigationActive';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
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
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const lastPlayed = useLibraryStore((s) => s.history[0] ?? null);
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchOnAirChannels(),
      fetchRadioStation().catch(() => null),
      fetchEnabledInternetRadioPresets(),
    ]).then(([channels, station, presets]) => {
      if (cancelled) {
        return;
      }
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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (radioPresets.length === 0) {
      return;
    }
    let cancelled = false;
    const refresh = () => {
      void Promise.all(
        radioPresets.map(async (preset) => {
          if (!preset.streamUrl) {
            return [preset.id, null] as const;
          }
          const title = await readIcyStreamTitle(preset.streamUrl);
          return [preset.id, title] as const;
        }),
      ).then((entries) => {
        if (cancelled) {
          return;
        }
        const next: Record<string, string> = {};
        for (const [id, title] of entries) {
          if (title) {
            next[id] = title;
          }
        }
        setPresetNowPlaying(next);
      });
    };
    refresh();
    const timer = window.setInterval(refresh, NOW_PLAYING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [radioPresets]);

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

  const radioLogo =
    radio?.user.avatarUrl ?? radio?.nowPlaying?.artworkUrl ?? null;
  const radioName = radio?.user.displayName ?? 'Tahti Radio';
  const radioPlayableId = `radio:${TAHTI_RADIO_SLUG}`;
  const radioIsCurrent = currentId === radioPlayableId;
  const radioIsPlaying =
    radioIsCurrent &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');

  const lastPlayedIsCurrent = lastPlayed
    ? currentId === lastPlayed.playable.id
    : false;
  const lastPlayedIsPlaying =
    lastPlayedIsCurrent &&
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
    <div className="flex max-w-5xl flex-col gap-6">
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
      >
        {tab === 'listen' ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {signedIn ? <ListenWidgetStoreDialog /> : null}
            {!signedIn ? (
              <Link to="/what-is-it">
                <Button size="sm" variant="secondary">
                  What is tahti.live?
                </Button>
              </Link>
            ) : null}
          </div>
        ) : null}

        {tab === 'feed' ? <FeedView embedded /> : null}
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
                        isPlaying={lastPlayedIsPlaying}
                        onPlay={() => {
                          if (lastPlayedIsCurrent) {
                            setPlaybackStatus(
                              lastPlayedIsPlaying ? 'paused' : 'playing',
                            );
                            return;
                          }
                          play(lastPlayed.playable);
                        }}
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
                isPlaying={radioIsPlaying}
                disabled={!radio.hlsUrl}
                onTogglePlay={toggleRadioPlayback}
                visualPreset={radio.visualPreset}
                colorScheme={radio.colorScheme}
                colorSchemeJson={radio.colorSchemeJson}
                visualSettingsJson={radio.visualSettingsJson}
              />
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
                          catalogStationId={
                            RADIO_STATIONS.find(
                              (station) => station.name === preset.name,
                            )?.id
                          }
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
                          subtitle={
                            presetNowPlaying[preset.id] ??
                            preset.genre ??
                            'Internet radio'
                          }
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
                              title: presetNowPlaying[preset.id] ?? preset.name,
                              artist: preset.name,
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
          </>
        ) : null}
      </ViewShell>
    </div>
  );
}
