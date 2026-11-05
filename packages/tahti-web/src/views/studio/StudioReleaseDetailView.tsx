import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  BarChart3Icon,
  Code2Icon,
  EyeIcon,
  LayersIcon,
  LayoutDashboardIcon,
  Link2Icon,
  MusicIcon,
  PartyPopperIcon,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  ButtonLink,
  EditIconButton,
  SaveButton,
  Tabs,
  Textarea,
  Tooltip,
  TrackTable,
} from '@tahti-player/ui';

import { deleteStudioRelease } from '../../api/studio';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CoverArtGenerator } from '../../components/CoverArtGenerator';
import { CoverArtPickerDialog } from '../../components/CoverArtPickerDialog';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../components/EntitySocialHeader';
import { FingerprintTrackPanel } from '../../components/FingerprintTrackPanel';
import { ImageUrlForm } from '../../components/ImageUrlForm';
import { MusicBrainzRegisterPrompt } from '../../components/MusicBrainzRegisterPrompt';
import { MusicBrainzSubmissionAssistant } from '../../components/MusicBrainzSubmissionAssistant';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { trackTableLabels } from '../../lib/trackTableLabels';
import {
  RELEASE_DETAIL_TABS,
  releaseDetailTabFromSearch,
  type ReleaseDetailTabId,
} from './release-detail/releaseDetailTabs';
import { ReleasePoweredByFooterToggle } from './release-detail/ReleasePoweredByFooterToggle';
import { ReleaseSmartLinksPanel } from './release-detail/ReleaseSmartLinksPanel';
import { ReleaseSmartLinkStats } from './release-detail/ReleaseSmartLinkStats';
import { ReleaseStatsPanel } from './release-detail/ReleaseStatsPanel';
import { ReleaseTrackCreditsPanel } from './release-detail/ReleaseTrackCreditsPanel';
import { ReleaseTrackVersionsPanel } from './release-detail/ReleaseTrackVersionsPanel';
import { useReleaseDetail } from './release-detail/useReleaseDetail';

export function StudioReleaseDetailView({ id }: { id: string }) {
  const { t } = useTranslation('web');
  const {
    user,
    currentId,
    playbackStatus,
    setPlaybackStatus,
    play,
    enqueue,
    release,
    setRelease,
    description,
    setDescription,
    loaded,
    loadError,
    retryLoad,
    publishing,
    confirmPublish,
    setConfirmPublish,
    artworkPreview,
    artworkPickerOpen,
    setArtworkPickerOpen,
    applyingArtwork,
    pendingArtworkDelete,
    setPendingArtworkDelete,
    saving,
    detailsExpanded,
    setDetailsExpanded,
    soundsById,
    releaseTracks,
    buildPlayable,
    save,
    publish,
    removeArtwork,
    applyArtwork,
    applyArtworkFromUrl,
    uploadArtworkFile,
    selectReleaseArtwork,
    playFirstTrack,
    updateTrackFingerprint,
  } = useReleaseDetail(id);

  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const removeRelease = async () => {
    setDeleting(true);
    const result = await deleteStudioRelease(id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(i18n.t('web:toasts.releaseDeleted'));
    void navigate({ to: '/studio/releases' });
  };

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
  const activeTab = releaseDetailTabFromSearch(searchTab);
  const selectedIndex = RELEASE_DETAIL_TABS.indexOf(activeTab);

  const setTab = (tab: ReleaseDetailTabId) => {
    void navigate({
      to: '/studio/releases/$id',
      params: { id },
      search: {
        ...(detailsExpanded ? { edit: true as const } : {}),
        ...(tab === 'overview' ? {} : { tab }),
      },
      replace: true,
    });
  };

  const headerStats: EntitySocialStat[] =
    release?.tracks && release.tracks.length > 0
      ? [
          {
            key: 'tracks',
            label: t('studioReleaseDetail.tabTracks'),
            value: release.tracks.length,
            icon: MusicIcon,
          },
        ]
      : [];

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout relative flex w-full flex-col gap-6 px-1 py-2">
        <Tooltip
          content={t('studioReleaseDetail.backToReleases')}
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink
            to="/studio/releases"
            aria-label={t('studioReleaseDetail.backToReleases')}
          />
        </Tooltip>
        {!release ? (
          <StudioPanel>
            {loaded && loadError ? (
              <PageError
                title={t('studioReleaseDetail.loadError')}
                description={loadError}
                onRetry={retryLoad}
              />
            ) : loaded ? (
              <PageEmpty
                headingLevel={1}
                title={t('studioReleaseDetail.notFound')}
              />
            ) : (
              <PageLoading label={t('settingsBody.loading')} />
            )}
          </StudioPanel>
        ) : (
          <>
            <EntitySocialHeader
              title={release.title}
              imageUrl={artworkPreview}
              imageAlt=""
              onImageClick={
                detailsExpanded ? () => setArtworkPickerOpen(true) : undefined
              }
              onImageDelete={
                detailsExpanded && artworkPreview
                  ? () => setPendingArtworkDelete(true)
                  : undefined
              }
              subtitle={`${release.type} · ${release.state}`}
              description={description.trim() || undefined}
              stats={headerStats}
              actions={
                <>
                  <Tooltip
                    content={t('studioReleaseDetail.openEmbedAria')}
                    side="top"
                  >
                    <ButtonLink
                      to="/r/$slug"
                      params={{ slug: release.smartLinkSlug }}
                      size="icon"
                      variant="secondary"
                      aria-label={t('studioReleaseDetail.openEmbedAria')}
                    >
                      <Code2Icon size={16} aria-hidden />
                    </ButtonLink>
                  </Tooltip>
                  <Tooltip
                    content={t('studioReleaseDetail.schedulePartyAria')}
                    side="top"
                  >
                    <ButtonLink
                      to="/studio/listening-parties/new"
                      search={{ releaseId: release.id }}
                      size="icon"
                      variant="secondary"
                      aria-label={t('studioReleaseDetail.schedulePartyAria')}
                      disabled={!release.tracks?.length}
                    >
                      <PartyPopperIcon size={16} aria-hidden />
                    </ButtonLink>
                  </Tooltip>
                  <Tooltip
                    content={t('studioReleaseDetail.deleteAria')}
                    side="top"
                  >
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label={t('studioReleaseDetail.deleteAria')}
                      disabled={deleting}
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2Icon
                        className="text-accent-red"
                        size={16}
                        aria-hidden
                      />
                    </Button>
                  </Tooltip>
                  {detailsExpanded ? (
                    <SaveButton saving={saving} onClick={() => void save()} />
                  ) : null}
                  <EditIconButton
                    label={i18n.t('web:actions.editDetails')}
                    editing={detailsExpanded}
                    onClick={() => setDetailsExpanded(!detailsExpanded)}
                  />
                </>
              }
              data-testid="studio-release-social-header"
            >
              <Button
                variant="secondary"
                onClick={() => void playFirstTrack()}
                disabled={!release.tracks?.length}
              >
                <PlayIcon size={16} aria-hidden className="mr-1.5" />
                {t('actions.play')}
              </Button>
            </EntitySocialHeader>

            <CoverArtPickerDialog
              isOpen={artworkPickerOpen}
              onClose={() => setArtworkPickerOpen(false)}
              label={t('studioReleaseDetail.artworkLabel')}
              value={artworkPreview}
              upload={uploadArtworkFile}
              onSelect={selectReleaseArtwork}
              extra={
                <>
                  <ImageUrlForm
                    busy={applyingArtwork}
                    onSubmit={applyArtworkFromUrl}
                  />
                  <CoverArtGenerator
                    generating={applyingArtwork}
                    onGenerate={(file) => void applyArtwork(file)}
                  />
                </>
              }
            />

            <ConfirmDialog
              isOpen={confirmPublish}
              title={t('studioReleaseDetail.publishTitle')}
              description={t('studioReleaseDetail.publishDescription')}
              confirmLabel={t('studioReleaseDetail.publishConfirm')}
              onCancel={() => setConfirmPublish(false)}
              onConfirm={() => {
                setConfirmPublish(false);
                void publish();
              }}
            />

            <ConfirmDialog
              isOpen={confirmDelete}
              title={t('studioReleaseDetail.deleteTitle')}
              description={t('studioReleaseDetail.deleteDescription')}
              confirmLabel={t('studioReleaseDetail.deleteConfirm')}
              destructive
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => {
                setConfirmDelete(false);
                void removeRelease();
              }}
            />

            <ConfirmDialog
              isOpen={pendingArtworkDelete}
              title={t('studioReleaseDetail.removeArtworkTitle')}
              description={t('studioReleaseDetail.removeArtworkDescription')}
              confirmLabel={t('studioReleaseDetail.removeArtworkConfirm')}
              destructive
              onCancel={() => setPendingArtworkDelete(false)}
              onConfirm={() => {
                setPendingArtworkDelete(false);
                void removeArtwork();
              }}
            />

            <Tabs
              listClassName="border-border border-b pb-3"
              panelClassName="flex flex-col gap-6 pt-2"
              selectedIndex={Math.max(0, selectedIndex)}
              onChange={(index) => {
                const next = RELEASE_DETAIL_TABS[index];
                if (next) {
                  setTab(next);
                }
              }}
              items={[
                {
                  id: 'overview',
                  label: t('studioReleaseDetail.tabOverview'),
                  icon: <LayoutDashboardIcon size={14} />,
                  content: (
                    <div className="flex flex-col gap-6">
                      {
                        <>
                          <StudioPanel
                            title={t('studioReleaseDetail.detailsTitle')}
                          >
                            {detailsExpanded ? (
                              <Textarea
                                label={t(
                                  'studioReleaseDetail.descriptionLabel',
                                )}
                                tone="secondary"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                              />
                            ) : (
                              <p className="text-foreground-secondary text-sm">
                                {description.trim() ||
                                  t('studioReleaseDetail.noDescription')}
                              </p>
                            )}
                          </StudioPanel>

                          {release.tracks && release.tracks.length > 0 && (
                            <StudioPanel
                              title={t('studioReleaseDetail.tracksTitle')}
                            >
                              <div className="min-h-[200px]">
                                <TrackTable
                                  tracks={releaseTracks}
                                  labels={trackTableLabels}
                                  getItemId={(_t, index) =>
                                    release.tracks?.[index]?.id ?? String(index)
                                  }
                                  features={{
                                    header: true,
                                    reorderable: false,
                                    filterable: true,
                                    sortable: false,
                                  }}
                                  display={{
                                    displayPosition: false,
                                    displayArtist: false,
                                    displayDuration: true,
                                    displayDeleteButton: false,
                                    displayThumbnail: true,
                                    displayQueueControls: true,
                                  }}
                                  actions={{
                                    onPlayNow: (t) => {
                                      const rt = release.tracks?.find(
                                        (candidate) =>
                                          candidate.id === t.source.id,
                                      );
                                      if (!rt) {
                                        return;
                                      }
                                      const playableId = `sound:${rt.soundId}`;
                                      if (currentId === playableId) {
                                        setPlaybackStatus(
                                          playbackStatus === 'playing' ||
                                            playbackStatus === 'loading'
                                            ? 'paused'
                                            : 'playing',
                                        );
                                      } else {
                                        void buildPlayable(rt).then(
                                          (playable) => {
                                            if (playable) {
                                              play(playable);
                                            }
                                          },
                                        );
                                      }
                                    },
                                    onAddToQueue: (t) => {
                                      const rt = release.tracks?.find(
                                        (candidate) =>
                                          candidate.id === t.source.id,
                                      );
                                      if (rt) {
                                        void buildPlayable(rt).then(
                                          (playable) => {
                                            if (playable) {
                                              enqueue(playable);
                                            }
                                          },
                                        );
                                      }
                                    },
                                    onEdit: (t) => {
                                      const rt = release.tracks?.find(
                                        (candidate) =>
                                          candidate.id === t.source.id,
                                      );
                                      if (rt?.soundId) {
                                        void navigate({
                                          to: '/studio/sounds/$id/editor',
                                          params: { id: rt.soundId },
                                        });
                                      }
                                    },
                                    onOpenDetail: (t) => {
                                      void navigate({
                                        to: '/studio/insights/$kind/$id',
                                        params: {
                                          kind: 'release-tracks',
                                          id: t.source.id,
                                        },
                                      });
                                    },
                                  }}
                                  meta={{
                                    canEditTrack: (track) =>
                                      Boolean(
                                        release.tracks?.find(
                                          (candidate) =>
                                            candidate.id === track.source.id,
                                        )?.soundId,
                                      ),
                                    canOpenDetail: () => true,
                                    isCurrentTrack: (track) => {
                                      const rt = release.tracks?.find(
                                        (candidate) =>
                                          candidate.id === track.source.id,
                                      );
                                      return Boolean(
                                        rt?.soundId &&
                                        currentId === `sound:${rt.soundId}`,
                                      );
                                    },
                                    isTrackPlaying: (track) => {
                                      const rt = release.tracks?.find(
                                        (candidate) =>
                                          candidate.id === track.source.id,
                                      );
                                      return Boolean(
                                        rt?.soundId &&
                                        currentId === `sound:${rt.soundId}` &&
                                        (playbackStatus === 'playing' ||
                                          playbackStatus === 'loading'),
                                      );
                                    },
                                  }}
                                />
                              </div>
                            </StudioPanel>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="secondary"
                              disabled={
                                publishing || release.state === 'PUBLISHED'
                              }
                              onClick={() => setConfirmPublish(true)}
                            >
                              <EyeIcon
                                size={14}
                                aria-hidden
                                className="mr-1.5"
                              />
                              {release.state === 'PUBLISHED'
                                ? t('studioReleaseDetail.published')
                                : t('studioReleaseDetail.publish')}
                            </Button>
                          </div>
                          {release.state === 'PUBLISHED' ? (
                            <MusicBrainzRegisterPrompt
                              title={release.title}
                              artistName={user?.displayName ?? ''}
                              releaseDate={release.releaseDate}
                              barcode={release.upc}
                              tracks={release.tracks}
                            />
                          ) : null}
                        </>
                      }
                      {
                        <StudioPanel
                          title={t('studioReleaseDetail.creditsTitle')}
                          description={t(
                            'studioReleaseDetail.creditsDescription',
                          )}
                        >
                          {release.tracks && release.tracks.length > 0 ? (
                            <ReleaseTrackCreditsPanel
                              releaseId={id}
                              tracks={release.tracks}
                              onTrackCreditsSaved={(trackId, credits) =>
                                setRelease((current) =>
                                  current
                                    ? {
                                        ...current,
                                        tracks: current.tracks?.map((t) =>
                                          t.id === trackId
                                            ? { ...t, credits }
                                            : t,
                                        ),
                                      }
                                    : current,
                                )
                              }
                            />
                          ) : (
                            <PageEmpty
                              title={t('studioReleaseDetail.noTracksTitle')}
                              description={t(
                                'studioReleaseDetail.noTracksDescription',
                              )}
                            />
                          )}
                        </StudioPanel>
                      }
                    </div>
                  ),
                },
                {
                  id: 'links',
                  label: t('studioReleaseDetail.tabLinks'),
                  icon: <Link2Icon size={14} />,
                  content: (
                    <div className="flex flex-col gap-6">
                      {
                        <div className="flex flex-col gap-4">
                          <ReleaseSmartLinkStats releaseId={release.id} />
                          <ReleaseSmartLinksPanel
                            release={release}
                            sounds={Object.values(soundsById)}
                            onTargetsSaved={(targets) =>
                              setRelease((current) =>
                                current
                                  ? { ...current, smartLinkTargets: targets }
                                  : current,
                              )
                            }
                            onReleaseChange={setRelease}
                          />
                          <ReleasePoweredByFooterToggle
                            release={release}
                            onChange={(showPoweredByFooter) =>
                              setRelease((current) =>
                                current
                                  ? { ...current, showPoweredByFooter }
                                  : current,
                              )
                            }
                          />
                        </div>
                      }
                      {
                        <StudioPanel
                          title={t('studioReleaseDetail.exportTitle')}
                          description={t(
                            'studioReleaseDetail.exportDescription',
                          )}
                        >
                          <MusicBrainzSubmissionAssistant
                            mode="release"
                            title={release.title}
                            artistName={user?.displayName ?? ''}
                            releaseDate={release.releaseDate}
                            barcode={release.upc}
                            tracks={release.tracks}
                          />
                        </StudioPanel>
                      }
                    </div>
                  ),
                },
                {
                  id: 'stats',
                  label: t('studioReleaseDetail.tabStats'),
                  icon: <BarChart3Icon size={14} />,
                  content: <ReleaseStatsPanel tracks={release.tracks ?? []} />,
                },
                {
                  id: 'advanced',
                  label: t('studioReleaseDetail.tabAdvanced'),
                  icon: <LayersIcon size={14} />,
                  content: (
                    <div className="flex flex-col gap-6">
                      {
                        <ReleaseTrackVersionsPanel
                          releaseId={id}
                          tracks={release.tracks ?? []}
                        />
                      }
                      {
                        <StudioPanel
                          title={t('studioReleaseDetail.fingerprintTitle')}
                          description={t(
                            'studioReleaseDetail.fingerprintDescription',
                          )}
                        >
                          {(() => {
                            const fingerprintable = (
                              release.tracks ?? []
                            ).filter((t) => t.sourceKey);
                            if (fingerprintable.length === 0) {
                              return (
                                <PageEmpty
                                  title={t(
                                    'studioReleaseDetail.fingerprintNoAudioTitle',
                                  )}
                                  description={t(
                                    'studioReleaseDetail.fingerprintNoAudioDescription',
                                  )}
                                />
                              );
                            }
                            return (
                              <div className="flex flex-col gap-3">
                                {fingerprintable.map((t) => (
                                  <FingerprintTrackPanel
                                    key={t.id}
                                    releaseId={id}
                                    track={t}
                                    onUpdated={(match) =>
                                      updateTrackFingerprint(t.id, match)
                                    }
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </StudioPanel>
                      }
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </StudioGate>
  );
}
