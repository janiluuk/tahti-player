import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowLeftToLineIcon,
  BanIcon,
  CheckCircle2Icon,
  HistoryIcon,
  ListPlusIcon,
  PauseIcon,
  PlayIcon,
  RadioTowerIcon,
  Settings2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  ButtonLink,
  MediaArtwork,
  Tabs,
  ViewShell,
} from '@tahti-player/ui';

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
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { ListingDate } from '../../components/ListingDate';
import { MulticastSection } from '../../components/MulticastSection';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { TahtiRotationPlaylistEditor } from '../../components/TahtiRotationPlaylistEditor';
import { usePlayerStore } from '../../stores/playerStore';
import {
  ADMIN_RADIO_TABS,
  adminRadioTabFromSearch,
  type AdminRadioTabId,
} from './adminRadioTabs';
import { InternetRadioPresetsPanel } from './InternetRadioPresetsPanel';

const ADMIN_RADIO_TAB_LABELS: Record<AdminRadioTabId, string> = {
  feature: 'Feature',
  presets: 'Stations',
  'opt-outs': 'Opt-outs',
  history: 'History',
};

export function AdminRadioView() {
  const { t } = useTranslation('web');
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    void Promise.all([
      fetchAdminRadio(),
      fetchAdminRadioRotation(),
      fetchRadioStation(),
    ]).then(([radioResult, rotationResult, stationResult]) => {
      setLoadError(
        radioResult.meta.source === 'api'
          ? (radioResult.meta.reason ?? null)
          : null,
      );
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
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminRadioView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="content" />
              <BreadcrumbLink to="/admin/radio">
                {t('adminRadioView.radio')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {ADMIN_RADIO_TAB_LABELS[activeTab]}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminRadioView.radio')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {msg && (
                <p className="text-foreground-secondary text-sm" role="status">
                  {msg}
                </p>
              )}

              {loading || !data ? (
                <StudioPanel>
                  <PageLoading label={t('loading.loadingRadio')} />
                </StudioPanel>
              ) : loadError ? (
                <StudioPanel>
                  <PageError
                    title={t('loadErrors.couldNotLoadTahtiRadio')}
                    description={loadError}
                    onRetry={() => {
                      setLoading(true);
                      reload();
                    }}
                  />
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
                      label: t('adminRadioViewMore.feature'),
                      icon: <RadioTowerIcon size={14} aria-hidden />,
                      content: (
                        <div className="flex flex-col gap-6">
                          <StudioPanel
                            title={
                              station?.data.hlsUrl && station.data.nowPlaying
                                ? t('adminRadioViewStates.streamLive')
                                : t('adminRadioViewStates.streamOffline')
                            }
                            description={
                              station?.data.hlsUrl && station.data.nowPlaying
                                ? t(
                                    'adminRadioViewStates.tahtiRadioIsBroadcastingThe',
                                  )
                                : t(
                                    'adminRadioViewStates.theTahtiRadioStreamIs',
                                  )
                            }
                            action={
                              station?.playable ? (
                                <Button
                                  size="sm"
                                  aria-label={
                                    stationPlaying
                                      ? t(
                                          'adminRadioViewStates.pauseTahtiRadioStream',
                                        )
                                      : t(
                                          'adminRadioViewStates.playTahtiRadioStream',
                                        )
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
                                  {stationPlaying
                                    ? t('adminRadio.pause')
                                    : t('adminRadio.listen')}
                                </Button>
                              ) : undefined
                            }
                          >
                            <div className="border-border bg-background flex items-center gap-3 rounded-lg border p-3">
                              <MediaArtwork
                                src={station?.data.nowPlaying?.artworkUrl}
                                alt=""
                                seed={
                                  station?.data.nowPlaying?.title ??
                                  'tahti-radio'
                                }
                                size="thumb"
                                className="size-10 shrink-0 rounded-md"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                                  {station?.data.hlsUrl &&
                                  station.data.nowPlaying
                                    ? data.nowPlaying.live
                                      ? t('adminRadio.liveGuestOnAir')
                                      : t('adminRadio.rotationOnAir')
                                    : t('adminRadio.playbackState')}
                                </p>
                                <p className="truncate font-semibold">
                                  {station?.data.nowPlaying?.title ??
                                    t('adminRadio.noActiveTrack')}
                                </p>
                                {station?.data.nowPlaying ? (
                                  <p className="text-foreground-secondary truncate text-sm">
                                    {station.data.nowPlaying.artistName}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <p className="text-foreground-secondary mt-3 text-xs">
                              {t('adminRadio.memberRelay')}{' '}
                              {data.nowPlaying.live &&
                              data.nowPlaying.artistName
                                ? t('adminRadio.memberRelayLive', {
                                    name: data.nowPlaying.artistName,
                                    slug: data.nowPlaying.slug,
                                  })
                                : t('adminRadio.memberRelayIdle')}
                            </p>
                          </StudioPanel>

                          <StudioPanel
                            title={t(
                              'adminRadioViewLabels.currentRotationLength',
                              { length: rotation.length },
                            )}
                            description={t(
                              'adminRadioView.dragTracksIntoTheExact',
                            )}
                          >
                            {rotation.length === 0 ? (
                              <PageEmpty
                                title={t('empties.adminRadioNoRotation')}
                                action={
                                  <ButtonLink
                                    to="/admin/tahti-selects"
                                    size="sm"
                                    variant="secondary"
                                  >
                                    <ListPlusIcon size={16} aria-hidden />
                                    {t('emptyActions.addToSelects')}
                                  </ButtonLink>
                                }
                              />
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
                            title={t(
                              'adminRadioViewLabels.eligibleChannelsLength',
                              { length: data.eligible.length },
                            )}
                            description={t(
                              'adminRadioView.optingAChannelOutOr',
                            )}
                          >
                            {data.eligible.length === 0 ? (
                              <PageEmpty
                                title={t('empties.adminRadioNoLiveMembers')}
                              />
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
                                      <div className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs">
                                        <span>/c/{ch.slug} ·</span>
                                        {ch.lastFeaturedAt ? (
                                          <>
                                            <span>last featured</span>
                                            <ListingDate
                                              value={ch.lastFeaturedAt}
                                            />
                                          </>
                                        ) : (
                                          <span>never featured</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        className="gap-1.5"
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
                                        {t('adminRadioView.moveToFront')}
                                      </Button>
                                      <Button
                                        className="gap-1.5"
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
                                        {t('adminRadioView.optOut')}
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </StudioPanel>

                          <StudioPanel
                            title={t('adminRadioView.multicast')}
                            description={t(
                              'adminRadioView.mirrorTahtiRadioToYoutube',
                            )}
                          >
                            <MulticastSection
                              scope="radio"
                              description={t(
                                'adminRadioView.destinationsThatReceiveTheTahti',
                              )}
                            />
                          </StudioPanel>
                        </div>
                      ),
                    },
                    {
                      id: 'presets',
                      label: t('adminRadioViewMore.stations'),
                      icon: <Settings2Icon size={14} aria-hidden />,
                      content: <InternetRadioPresetsPanel />,
                    },
                    {
                      id: 'opt-outs',
                      label: t('adminRadioViewMore.optOuts'),
                      icon: <BanIcon size={14} aria-hidden />,
                      content:
                        data.optedOut.length === 0 ? (
                          <StudioPanel title={t('adminRadioView.optedOut')}>
                            <PageEmpty
                              title={t('empties.adminRadioNoOptOuts')}
                            />
                          </StudioPanel>
                        ) : (
                          <StudioPanel
                            title={t('adminRadioViewLabels.optedOutLength', {
                              length: data.optedOut.length,
                            })}
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
                                        {t('adminRadioView.live')}
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    className="gap-1.5"
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
                                    {t('adminRadioView.reEnable')}
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </StudioPanel>
                        ),
                    },
                    {
                      id: 'history',
                      label: t('adminRadioViewMore.history'),
                      icon: <HistoryIcon size={14} aria-hidden />,
                      content: (
                        <StudioPanel title={t('adminRadioView.featureHistory')}>
                          {data.history.length === 0 ? (
                            <PageEmpty
                              title={t('empties.adminRadioNoHistory')}
                            />
                          ) : (
                            <ul className="divide-border divide-y">
                              {data.history.map((item, i) => (
                                <li
                                  key={`${item.channelId}-${i}`}
                                  className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                                >
                                  <span>{item.artistName}</span>
                                  <ListingDate
                                    value={item.featuredAt}
                                    className="text-foreground-secondary text-xs"
                                  />
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
