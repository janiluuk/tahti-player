import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  Code2Icon,
  EyeIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  Link2Icon,
  MusicIcon,
  PencilIcon,
  PlayIcon,
  Share2Icon,
  UploadIcon,
  Wand2Icon,
} from 'lucide-react';

import {
  Button,
  Dialog,
  EmptyState,
  FilePicker,
  SaveButton,
  Tabs,
  Textarea,
  Tooltip,
  TrackTable,
} from '@tahti-player/ui';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CoverArtGenerator } from '../../components/CoverArtGenerator';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../components/EntitySocialHeader';
import { FingerprintTrackPanel } from '../../components/FingerprintTrackPanel';
import { MusicBrainzSubmissionAssistant } from '../../components/MusicBrainzSubmissionAssistant';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { trackTableLabels } from '../../lib/trackTableLabels';
import { ReleaseSmartLinksPanel } from './release-detail/ReleaseSmartLinksPanel';
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
    playFirstTrack,
    updateTrackFingerprint,
  } = useReleaseDetail(id);

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
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/releases" />
        <Tooltip content="Back to Releases" side="right">
          <Link
            to="/studio/releases"
            aria-label="Back to Releases"
            className="text-foreground-secondary hover:bg-background-secondary -mt-2 inline-flex size-8 w-fit items-center justify-center rounded-full"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Link>
        </Tooltip>
        {!release ? (
          <StudioPanel>
            {loaded ? (
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
                    <Link
                      to="/r/$slug"
                      params={{ slug: release.smartLinkSlug }}
                      className="bg-background border-border text-foreground flex size-9 items-center justify-center rounded-md border-(length:--border-width)"
                      aria-label="Open release embed"
                    >
                      <Code2Icon size={16} aria-hidden />
                    </Link>
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

            <Dialog.Root
              isOpen={artworkPickerOpen}
              onClose={() => setArtworkPickerOpen(false)}
              className="max-w-2xl"
            >
              <Dialog.Title>Release artwork</Dialog.Title>
              <Tabs
                listClassName="border-border mt-4 border-b pb-3"
                panelClassName="pt-4"
                items={[
                  {
                    id: 'upload',
                    label: 'Upload',
                    icon: <UploadIcon size={14} />,
                    content: (
                      <FilePicker
                        labels={{
                          title: 'Release artwork',
                          description: 'JPEG, PNG, or WebP',
                          browse: 'Choose image',
                        }}
                        accept="image/jpeg,image/png,image/webp"
                        onFiles={(files) => {
                          const file = files[0];
                          if (!file) {
                            return;
                          }
                          void applyArtwork(file);
                        }}
                      />
                    ),
                  },
                  {
                    id: 'generate',
                    label: 'Generate',
                    icon: <Wand2Icon size={14} />,
                    content: (
                      <CoverArtGenerator
                        generating={applyingArtwork}
                        onGenerate={(file) => void applyArtwork(file)}
                      />
                    ),
                  },
                ]}
              />
            </Dialog.Root>

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
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-foreground-secondary text-xs uppercase">
                              Description
                            </span>
                            <Textarea
                              tone="secondary"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              rows={3}
                            />
                          </label>
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
                              }}
                              meta={{
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
                    </>
                  ),
                },
                {
                  id: 'smart-links',
                  label: 'Smart links',
                  icon: <Link2Icon size={14} />,
                  content: (
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
                            <EmptyState
                              size="sm"
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
