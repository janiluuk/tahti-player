import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  BarChart3Icon,
  Code2Icon,
  EyeIcon,
  FingerprintIcon,
  LayersIcon,
  LayoutDashboardIcon,
  Link2Icon,
  MusicIcon,
  PartyPopperIcon,
  PencilIcon,
  PlayIcon,
  Share2Icon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  ButtonLink,
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
    toast.success('Release deleted.');
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
      search: tab === 'overview' ? {} : { tab },
      replace: true,
    });
  };

  const headerStats: EntitySocialStat[] =
    release?.tracks && release.tracks.length > 0
      ? [
          {
            key: 'tracks',
            label: 'Tracks',
            value: release.tracks.length,
            icon: MusicIcon,
          },
        ]
      : [];

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout relative flex w-full flex-col gap-6 px-1 py-2">
        <Tooltip
          content="Back to Releases"
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink to="/studio/releases" aria-label="Back to Releases" />
        </Tooltip>
        {!release ? (
          <StudioPanel>
            {loaded && loadError ? (
              <PageError
                title="Could not load this release"
                description={loadError}
                onRetry={retryLoad}
              />
            ) : loaded ? (
              <PageEmpty title="Release not found in list" />
            ) : (
              <PageLoading label="Loading…" />
            )}
          </StudioPanel>
        ) : (
          <>
            <EntitySocialHeader
              title={release.title}
              imageUrl={artworkPreview}
              imageAlt=""
              onImageClick={() => setArtworkPickerOpen(true)}
              onImageDelete={
                artworkPreview ? () => setPendingArtworkDelete(true) : undefined
              }
              subtitle={`${release.type} · ${release.state}`}
              description={description.trim() || undefined}
              stats={headerStats}
              actions={
                <>
                  <Tooltip content="Open release embed" side="top">
                    <ButtonLink
                      to="/r/$slug"
                      params={{ slug: release.smartLinkSlug }}
                      size="icon"
                      variant="secondary"
                      aria-label="Open release embed"
                    >
                      <Code2Icon size={16} aria-hidden />
                    </ButtonLink>
                  </Tooltip>
                  <Tooltip content="Schedule listening party" side="top">
                    <ButtonLink
                      to="/studio/listening-parties/new"
                      search={{ releaseId: release.id }}
                      size="icon"
                      variant="secondary"
                      aria-label="Schedule listening party"
                      disabled={!release.tracks?.length}
                    >
                      <PartyPopperIcon size={16} aria-hidden />
                    </ButtonLink>
                  </Tooltip>
                  <Tooltip content="Delete release" side="top">
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Delete release"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2Icon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                  <SaveButton saving={saving} onClick={() => void save()} />
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
                Play
              </Button>
            </EntitySocialHeader>

            <CoverArtPickerDialog
              isOpen={artworkPickerOpen}
              onClose={() => setArtworkPickerOpen(false)}
              label="Release artwork"
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
              title="Publish this release?"
              description="Publishing makes the release and its smart link visible to listeners."
              confirmLabel="Publish"
              onCancel={() => setConfirmPublish(false)}
              onConfirm={() => {
                setConfirmPublish(false);
                void publish();
              }}
            />

            <ConfirmDialog
              isOpen={confirmDelete}
              title="Delete this release?"
              description="Its tracklist, smart link and stats are removed. Tracks you uploaded stay in your library. This can't be undone."
              confirmLabel="Delete release"
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => {
                setConfirmDelete(false);
                void removeRelease();
              }}
            />

            <ConfirmDialog
              isOpen={pendingArtworkDelete}
              title="Remove artwork?"
              description="The release will fall back to its default placeholder until you upload new artwork."
              confirmLabel="Remove artwork"
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
                  label: 'Overview',
                  icon: <LayoutDashboardIcon size={14} />,
                  content: (
                    <>
                      <StudioPanel
                        title="Details"
                        action={
                          <Button
                            className="gap-1.5"
                            size="sm"
                            variant="secondary"
                            onClick={() => setDetailsExpanded((v) => !v)}
                          >
                            <PencilIcon size={14} aria-hidden />
                            {detailsExpanded ? 'Done' : 'Edit details'}
                          </Button>
                        }
                      >
                        {detailsExpanded ? (
                          <Textarea
                            label="Description"
                            tone="secondary"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <p className="text-foreground-secondary text-sm">
                            {description.trim() || 'No description set yet.'}
                          </p>
                        )}
                      </StudioPanel>

                      {release.tracks && release.tracks.length > 0 && (
                        <StudioPanel title="Tracks">
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
                                    (candidate) => candidate.id === t.source.id,
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
                                    void buildPlayable(rt).then((playable) => {
                                      if (playable) {
                                        play(playable);
                                      }
                                    });
                                  }
                                },
                                onAddToQueue: (t) => {
                                  const rt = release.tracks?.find(
                                    (candidate) => candidate.id === t.source.id,
                                  );
                                  if (rt) {
                                    void buildPlayable(rt).then((playable) => {
                                      if (playable) {
                                        enqueue(playable);
                                      }
                                    });
                                  }
                                },
                                onEdit: (t) => {
                                  const rt = release.tracks?.find(
                                    (candidate) => candidate.id === t.source.id,
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
                          disabled={publishing || release.state === 'PUBLISHED'}
                          onClick={() => setConfirmPublish(true)}
                        >
                          <EyeIcon size={14} aria-hidden className="mr-1.5" />
                          {release.state === 'PUBLISHED'
                            ? 'Published'
                            : 'Publish'}
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
                  ),
                },
                {
                  id: 'stats',
                  label: 'Stats',
                  icon: <BarChart3Icon size={14} />,
                  content: <ReleaseStatsPanel tracks={release.tracks ?? []} />,
                },
                {
                  id: 'smart-links',
                  label: 'Smart links',
                  icon: <Link2Icon size={14} />,
                  content: (
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
                  ),
                },
                {
                  id: 'credits',
                  label: 'Credits',
                  icon: <UsersIcon size={14} />,
                  content: (
                    <StudioPanel
                      title="Track credits"
                      description="Who played, sang, wrote or produced each track."
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
                                      t.id === trackId ? { ...t, credits } : t,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                      ) : (
                        <PageEmpty
                          title="No tracks on this release yet"
                          description="Add tracks first, then credit the people on each one."
                        />
                      )}
                    </StudioPanel>
                  ),
                },
                {
                  id: 'versions',
                  label: 'Versions',
                  icon: <LayersIcon size={14} />,
                  content: (
                    <ReleaseTrackVersionsPanel
                      releaseId={id}
                      tracks={release.tracks ?? []}
                    />
                  ),
                },
                {
                  id: 'fingerprinting',
                  label: 'Fingerprinting',
                  icon: <FingerprintIcon size={14} />,
                  content: (
                    <StudioPanel
                      title="Fingerprinting"
                      description="Optional. Checks each track against AcoustID's public database of released music, so you get a heads-up if it matches something already out there — nothing is blocked either way. Every upload is checked automatically; use the buttons below only to re-check a track you just replaced, or to check one on demand."
                    >
                      {(() => {
                        const fingerprintable = (release.tracks ?? []).filter(
                          (t) => t.sourceKey,
                        );
                        if (fingerprintable.length === 0) {
                          return (
                            <PageEmpty
                              title="No tracks have audio uploaded yet"
                              description="Fingerprinting needs a track's audio file on file first."
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
                  ),
                },
                {
                  id: 'export',
                  label: 'Export',
                  icon: <Share2Icon size={15} />,
                  content: (
                    <StudioPanel
                      title="Export release"
                      description="Prepare this release for MusicBrainz and manage its distribution metadata."
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
