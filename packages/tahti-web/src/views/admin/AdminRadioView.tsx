import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowLeftToLineIcon,
  BanIcon,
  CheckCircle2Icon,
  HistoryIcon,
  PauseIcon,
  PlayIcon,
  RadioTowerIcon,
  Settings2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button, Tabs, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminRadio,
  fetchAdminRadioRotation,
  radioMoveToFront,
  radioOptOut,
  radioRemoveOptOut,
  type AdminRadioData,
  type AdminSelectsItem,
} from '../../api/admin';
import { fetchRadioStation } from '../../api/client';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { MulticastSection } from '../../components/MulticastSection';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { TahtiRotationPlaylistEditor } from '../../components/TahtiRotationPlaylistEditor';
import { usePlayerStore } from '../../stores/playerStore';
import {
  ADMIN_RADIO_TABS,
  adminRadioTabFromSearch,
  type AdminRadioTabId,
} from './adminRadioTabs';
import { InternetRadioPresetsPanel } from './InternetRadioPresetsPanel';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminRadioView() {
  const play = usePlayerStore((state) => state.play);
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);
  const [data, setData] = useState<AdminRadioData | null>(null);
  const [rotation, setRotation] = useState<AdminSelectsItem[]>([]);
  const [station, setStation] = useState<Awaited<
    ReturnType<typeof fetchRadioStation>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    void Promise.all([
      fetchAdminRadio(),
      fetchAdminRadioRotation(),
      fetchRadioStation(),
    ]).then(([radioResult, rotationResult, stationResult]) => {
      setData(radioResult.data);
      setRotation(rotationResult.data);
      setStation(stationResult);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const stationPlayableId = 'radio:tahti-radio';
  const stationPlaying =
    currentId === stationPlayableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const togglePlayback = () => {
    if (!station?.playable) {
      return;
    }
    if (currentId === stationPlayableId) {
      setPlaybackStatus(stationPlaying ? 'paused' : 'playing');
      return;
    }
    play({ ...station.playable, id: stationPlayableId });
  };

  const preview = (item: AdminSelectsItem) => {
    if (!item.audioUrl) {
      return;
    }
    play({
      id: `sound:${item.soundId}`,
      kind: 'sound',
      title: item.title,
      artist: item.artistName,
      streamUrl: item.audioUrl,
      protocol: item.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: item.channelSlug,
    });
  };

  const navigate = useNavigate();
  const searchTab = useRouterState({
    select: (s) => {
      const raw = s.location.search;
      if (typeof raw === 'string') {
        return new URLSearchParams(raw).get('tab') ?? undefined;
      }
      if (raw && typeof raw === 'object' && 'tab' in raw) {
        const tab = (raw as { tab?: unknown }).tab;
        return typeof tab === 'string' ? tab : undefined;
      }
      return undefined;
    },
  });
  const activeTab = adminRadioTabFromSearch(searchTab);
  const selectedIndex = ADMIN_RADIO_TABS.indexOf(activeTab);

  const setTab = (tab: AdminRadioTabId) => {
    void navigate({
      to: '/admin/radio',
      search: tab === 'feature' ? {} : { tab },
      replace: true,
    });
  };

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/radio">
          <div className="flex max-w-4xl flex-col gap-6">
            <ViewShell title="Radio" classes={{ root: 'px-0 pt-0' }}>
              {msg && (
                <p className="text-foreground-secondary text-sm" role="status">
                  {msg}
                </p>
              )}

              {loading || !data ? (
                <StudioPanel>
                  <PageLoading label="Loading radio…" />
                </StudioPanel>
              ) : (
                <Tabs
                  listClassName="mb-4 flex-wrap overflow-x-auto"
                  selectedIndex={Math.max(0, selectedIndex)}
                  onChange={(index) => {
                    const next = ADMIN_RADIO_TABS[index];
                    if (next) {
                      setTab(next);
                    }
                  }}
                  items={[
                    {
                      id: 'feature',
                      label: 'Feature',
                      icon: <RadioTowerIcon size={14} aria-hidden />,
                      content: (
                        <div className="flex flex-col gap-6">
                          <StudioPanel
                            title={
                              station?.data.hlsUrl && station.data.nowPlaying
                                ? 'Stream live'
                                : 'Stream offline'
                            }
                            description={
                              station?.data.hlsUrl && station.data.nowPlaying
                                ? 'Tahti Radio is broadcasting the member rotation or a live guest channel.'
                                : 'The Tahti Radio stream is currently unavailable.'
                            }
                            action={
                              station?.playable ? (
                                <Button
                                  size="sm"
                                  aria-label={
                                    stationPlaying
                                      ? 'Pause Tahti Radio stream'
                                      : 'Play Tahti Radio stream'
                                  }
                                  onClick={togglePlayback}
                                >
                                  {stationPlaying ? (
                                    <PauseIcon
                                      size={15}
                                      aria-hidden
                                      className="mr-1.5"
                                    />
                                  ) : (
                                    <PlayIcon
                                      size={15}
                                      aria-hidden
                                      className="mr-1.5"
                                    />
                                  )}
                                  {stationPlaying ? 'Pause' : 'Listen'}
                                </Button>
                              ) : undefined
                            }
                          >
                            <div className="border-border bg-background flex items-center gap-3 rounded-lg border p-3">
                              <div className="bg-background-secondary text-foreground-secondary flex size-10 shrink-0 items-center justify-center rounded-full">
                                <RadioTowerIcon size={20} aria-hidden />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                                  {station?.data.hlsUrl &&
                                  station.data.nowPlaying
                                    ? data.nowPlaying.live
                                      ? 'Live guest on air'
                                      : 'Rotation on air'
                                    : 'Playback state'}
                                </p>
                                <p className="truncate font-semibold">
                                  {station?.data.nowPlaying?.title ??
                                    'No active track'}
                                </p>
                                {station?.data.nowPlaying ? (
                                  <p className="text-foreground-secondary truncate text-sm">
                                    {station.data.nowPlaying.artistName}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <p className="text-foreground-secondary mt-3 text-xs">
                              Member relay:{' '}
                              {data.nowPlaying.live &&
                              data.nowPlaying.artistName
                                ? `${data.nowPlaying.artistName} · /c/${data.nowPlaying.slug}`
                                : 'no live member channel · rotation should continue'}
                            </p>
                          </StudioPanel>

                          <StudioPanel
                            title={`Current rotation (${rotation.length})`}
                            description="Drag tracks into the exact order listeners will hear between live shows."
                          >
                            {rotation.length === 0 ? (
                              <PageEmpty title="Nothing is in rotation yet" />
                            ) : (
                              <TahtiRotationPlaylistEditor
                                items={rotation}
                                onPreview={preview}
                                readOnly
                                onReorder={() => undefined}
                                onRemove={() => undefined}
                              />
                            )}
                          </StudioPanel>

                          <StudioPanel
                            title={`Eligible channels (${data.eligible.length})`}
                          >
                            {data.eligible.length === 0 ? (
                              <PageEmpty title="No member channels are live right now" />
                            ) : (
                              <ul className="divide-border divide-y">
                                {data.eligible.map((ch) => (
                                  <li
                                    key={ch.channelId}
                                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {ch.artistName}
                                      </div>
                                      <div className="text-foreground-secondary text-xs">
                                        /c/{ch.slug} ·{' '}
                                        {ch.lastFeaturedAt
                                          ? `last featured ${fmt(ch.lastFeaturedAt)}`
                                          : 'never featured'}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          void radioMoveToFront(
                                            ch.channelId,
                                          ).then((r) => {
                                            if (!r.ok) {
                                              setMsg(r.error);
                                            } else {
                                              reload();
                                            }
                                          });
                                        }}
                                      >
                                        <ArrowLeftToLineIcon
                                          size={14}
                                          aria-hidden
                                        />
                                        Move to front
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="text"
                                        onClick={() => {
                                          void radioOptOut(ch.channelId).then(
                                            (r) => {
                                              if (!r.ok) {
                                                setMsg(r.error);
                                              } else {
                                                reload();
                                              }
                                            },
                                          );
                                        }}
                                      >
                                        <XCircleIcon size={14} aria-hidden />
                                        Opt out
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </StudioPanel>

                          <StudioPanel
                            title="Multicast"
                            description="Mirror Tahti Radio to YouTube, Twitch and other RTMP destinations."
                          >
                            <MulticastSection
                              scope="radio"
                              description="Destinations that receive the Tahti Radio stream."
                            />
                          </StudioPanel>
                        </div>
                      ),
                    },
                    {
                      id: 'presets',
                      label: 'Presets',
                      icon: <Settings2Icon size={14} aria-hidden />,
                      content: <InternetRadioPresetsPanel />,
                    },
                    {
                      id: 'opt-outs',
                      label: 'Opt-outs',
                      icon: <BanIcon size={14} aria-hidden />,
                      content:
                        data.optedOut.length === 0 ? (
                          <StudioPanel title="Opted out">
                            <PageEmpty title="No channels have opted out" />
                          </StudioPanel>
                        ) : (
                          <StudioPanel
                            title={`Opted out (${data.optedOut.length})`}
                          >
                            <ul className="divide-border divide-y">
                              {data.optedOut.map((ch) => (
                                <li
                                  key={ch.channelId}
                                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{ch.artistName}</span>
                                    <span className="text-foreground-secondary text-xs">
                                      /c/{ch.slug}
                                    </span>
                                    {ch.isLive && (
                                      <Badge variant="pill" color="green">
                                        Live
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      void radioRemoveOptOut(ch.channelId).then(
                                        (r) => {
                                          if (!r.ok) {
                                            setMsg(r.error);
                                          } else {
                                            reload();
                                          }
                                        },
                                      );
                                    }}
                                  >
                                    <CheckCircle2Icon size={14} aria-hidden />
                                    Re-enable
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </StudioPanel>
                        ),
                    },
                    {
                      id: 'history',
                      label: 'History',
                      icon: <HistoryIcon size={14} aria-hidden />,
                      content: (
                        <StudioPanel title="Feature history">
                          {data.history.length === 0 ? (
                            <PageEmpty title="No history yet" />
                          ) : (
                            <ul className="divide-border divide-y">
                              {data.history.map((item, i) => (
                                <li
                                  key={`${item.channelId}-${i}`}
                                  className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                                >
                                  <span>{item.artistName}</span>
                                  <span className="text-foreground-secondary text-xs">
                                    {fmt(item.featuredAt)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </StudioPanel>
                      ),
                    },
                  ]}
                />
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
