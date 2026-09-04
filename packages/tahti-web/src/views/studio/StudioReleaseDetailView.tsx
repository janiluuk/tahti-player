import { Link } from '@tanstack/react-router';
import {
  Code2Icon,
  ExternalLinkIcon,
  FilterIcon,
  FingerprintIcon,
  GripVerticalIcon,
  LayoutDashboardIcon,
  Link2Icon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  EmptyState,
  FilePicker,
  Input,
  SaveButton,
  Select,
  Tabs,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import {
  addStudioReleaseTrack,
  fetchEditorSource,
  fetchStudioReleases,
  fetchStudioSound,
  fetchStudioSounds,
  patchStudioRelease,
  removeStudioReleaseTrack,
  reorderStudioReleaseTracks,
  uploadReleaseArtwork,
} from '../../api/studio';
import type {
  FingerprintMatch,
  StudioRelease,
  StudioSound,
} from '../../api/studio-types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmbedTrackRow } from '../../components/EmbedTrackRow';
import { FingerprintTrackPanel } from '../../components/FingerprintTrackPanel';
import { MusicBrainzSubmissionAssistant } from '../../components/MusicBrainzSubmissionAssistant';
import { PageEmpty } from '../../components/PageStates';
import { SourceServiceIcon } from '../../components/SourceServiceIcon';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';
import {
  composeDspUrl,
  displayDspPrefix,
  DSP_SERVICES,
  fillAllDspUrls,
  isPluginStreamService,
  loadDspPluginPrefixes,
  prefixesForServices,
} from '../../lib/dspPluginDefaults';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';

export function StudioReleaseDetailView({ id }: { id: string }) {
  const user = useAuthStore((state) => state.user);
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const play = usePlayerStore((state) => state.play);
  const [release, setRelease] = useState<StudioRelease | null>(null);
  const [description, setDescription] = useState('');
  const [spotify, setSpotify] = useState('');
  const [bandcamp, setBandcamp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [artworkPickerOpen, setArtworkPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchStudioReleases().then((res) => {
      const found = res.data.releases.find((r) => r.id === id) ?? null;
      setRelease(found);
      setDescription(found?.description ?? '');
      setSpotify(found?.smartLinkTargets?.spotify ?? '');
      setBandcamp(found?.smartLinkTargets?.bandcamp ?? '');
      setArtworkPreview(found?.artworkUrl ?? null);
    });
  }, [id]);

  const save = async () => {
    setMessage(null);
    setSaving(true);
    const result = await patchStudioRelease(id, {
      description,
      smartLinkTargets: {
        ...(release?.smartLinkTargets ?? {}),
        spotify,
        bandcamp,
      },
    });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setRelease(result.data);
    setMessage('Saved.');
  };

  const playFirstTrack = async () => {
    const firstTrack = release?.tracks?.[0];
    if (!firstTrack?.soundId) {
      toast.info('The first track is not playable yet.');
      return;
    }
    const source = await fetchEditorSource(firstTrack.soundId);
    if (!source.data.url) {
      toast.info('The first track is still being prepared.');
      return;
    }
    play({
      id: `archive:${firstTrack.soundId}`,
      kind: 'archive',
      title: firstTrack.title,
      artist: user?.displayName ?? 'You',
      streamUrl: source.data.url,
      protocol: source.data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const updateTrackFingerprint = (
    trackId: string,
    match: FingerprintMatch | null,
  ) => {
    setRelease((prev) =>
      prev
        ? {
            ...prev,
            tracks: prev.tracks?.map((t) =>
              t.id === trackId ? { ...t, fingerprintMatch: match } : t,
            ),
          }
        : prev,
    );
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-2xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/releases" />
        <Link
          to="/studio/releases"
          className="text-foreground-secondary -mt-2 text-xs hover:underline"
        >
          ← Releases
        </Link>
        {!release ? (
          <StudioPanel>
            <PageEmpty title="Release not found in list" />
          </StudioPanel>
        ) : (
          <>
            <StudioPageHeader
              title={release.title}
              subtitle={`${release.state} — /r/${release.smartLinkSlug}`}
              action={
                <div className="flex flex-wrap justify-end gap-2">
                  <SaveButton saving={saving} onClick={() => void save()} />
                </div>
              }
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
                      <div className="group border-border bg-background-secondary relative isolate min-h-64 overflow-hidden rounded-xl border shadow-sm sm:min-h-72">
                        {artworkPreview ? (
                          <img
                            src={artworkPreview}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                        ) : (
                          <div className="bg-background text-foreground-secondary absolute inset-0 flex items-center justify-center text-sm">
                            No artwork
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/25 to-black/70" />
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 text-white">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold tracking-[0.16em] text-white/70 uppercase">
                              {release.type} · {release.state}
                            </p>
                            <h2 className="mt-1 truncate text-2xl leading-tight font-bold sm:text-3xl">
                              {release.title}
                            </h2>
                            <p className="mt-1 truncate text-sm text-white/80">
                              {user?.displayName ?? 'Tahti artist'}
                            </p>
                          </div>
                          <Link
                            to="/r/$slug"
                            params={{ slug: release.smartLinkSlug }}
                            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                            aria-label="Open release embed"
                            title="Open release embed"
                          >
                            <Code2Icon size={17} aria-hidden />
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => void playFirstTrack()}
                          disabled={!release.tracks?.length}
                          className="bg-primary text-primary-foreground focus-visible:outline-primary absolute right-4 bottom-4 flex size-12 items-center justify-center rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:scale-105 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none"
                          aria-label={`Play ${release.title}`}
                          title={`Play ${release.title}`}
                        >
                          <PlayIcon size={20} fill="currentColor" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setArtworkPickerOpen(true)}
                          aria-label="Change release artwork"
                          title="Change release artwork"
                          className="absolute bottom-4 left-4 rounded-md border border-white/30 bg-black/30 px-2.5 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-white/20 focus-visible:opacity-100"
                        >
                          Change artwork
                        </button>
                      </div>

                      <Dialog.Root
                        isOpen={artworkPickerOpen}
                        onClose={() => setArtworkPickerOpen(false)}
                        className="max-w-lg"
                      >
                        <Dialog.Title>Release artwork</Dialog.Title>
                        <div className="mt-4">
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
                              void uploadReleaseArtwork(id, file).then((r) => {
                                if (!r.ok) {
                                  setMessage(r.error);
                                  toast.error(r.error);
                                } else {
                                  setArtworkPreview(r.artworkUrl);
                                  setMessage('Artwork uploaded.');
                                  toast.success('Artwork uploaded.');
                                }
                                setArtworkPickerOpen(false);
                              });
                            }}
                          />
                        </div>
                      </Dialog.Root>

                      <StudioPanel title="Details">
                        <div className="flex flex-col gap-3">
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
                        </div>
                      </StudioPanel>

                      {release.tracks && release.tracks.length > 0 && (
                        <StudioPanel title="Tracks">
                          <ol className="text-foreground-secondary list-decimal space-y-2 pl-5 text-sm">
                            {release.tracks.map((t) => (
                              <ReleaseTrackRow
                                key={t.id}
                                track={t}
                                shopUrl={release.smartLinkTargets?.bandcamp}
                                isPlaying={
                                  currentId === `archive:${t.soundId}` &&
                                  (playbackStatus === 'playing' ||
                                    playbackStatus === 'loading')
                                }
                              />
                            ))}
                          </ol>
                        </StudioPanel>
                      )}

                      {message && <p className="text-sm">{message}</p>}

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            void patchStudioRelease(id, {
                              state: 'PUBLISHED',
                            }).then((r) => {
                              if (!r.ok) {
                                setMessage(r.error);
                              } else {
                                setRelease(r.data);
                                setMessage('Published.');
                              }
                            });
                          }}
                        >
                          Publish
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
                      spotify={spotify}
                      bandcamp={bandcamp}
                      onSpotifyChange={setSpotify}
                      onBandcampChange={setBandcamp}
                      onTargetsSaved={(targets) =>
                        setRelease((current) =>
                          current
                            ? { ...current, smartLinkTargets: targets }
                            : current,
                        )
                      }
                      onMessage={setMessage}
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

function ReleaseTrackRow({
  track,
  shopUrl,
  isPlaying = false,
}: {
  track: NonNullable<StudioRelease['tracks']>[number];
  shopUrl?: string;
  isPlaying?: boolean;
}) {
  const play = usePlayerStore((state) => state.play);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [embed, setEmbed] = useState<{
    provider: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP';
    uri: string;
  } | null>(null);

  useEffect(() => {
    if (!track.soundId) {
      return;
    }
    const archiveId = track.soundId;
    void fetchStudioSound(archiveId).then((result) => {
      if (result.data.embedProvider && result.data.embedUri) {
        setEmbed({
          provider: result.data.embedProvider,
          uri: result.data.embedUri,
        });
        return;
      }
      void fetchEditorSource(archiveId).then((source) =>
        setSourceUrl(source.data.url),
      );
    });
  }, [track.soundId]);

  if (embed) {
    return (
      <EmbedTrackRow
        title={track.title}
        provider={embed.provider}
        embedUri={embed.uri}
        className={isPlaying ? 'border-primary bg-primary/10' : ''}
      />
    );
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 transition-colors ${isPlaying ? 'border-primary bg-primary/10 text-primary' : 'border-transparent'}`}
      aria-current={isPlaying ? 'true' : undefined}
    >
      <span className="min-w-0 flex-1 truncate">{track.title}</span>
      {sourceUrl ? (
        <Tooltip content={`Play ${track.title}`} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={`Play ${track.title}`}
            onClick={() =>
              play({
                id: `archive:${track.soundId}`,
                kind: 'archive',
                title: track.title,
                artist: 'You',
                streamUrl: sourceUrl,
                protocol: sourceUrl.includes('.m3u8') ? 'hls' : 'https',
              })
            }
          >
            <PlayIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      {track.soundId ? (
        <Link
          to="/studio/sounds/$id/editor"
          params={{ id: track.soundId }}
          className="text-primary text-xs underline"
        >
          editor
        </Link>
      ) : null}
      {shopUrl ? (
        <a
          href={shopUrl}
          target="_blank"
          rel="noreferrer"
          className="border-border inline-flex size-7 items-center justify-center overflow-hidden rounded border"
          aria-label={`Open ${track.title} on Bandcamp`}
          title="Open on Bandcamp"
        >
          <SourceServiceIcon id="bandcamp" size="detail" />
        </a>
      ) : null}
    </li>
  );
}

function ReleaseSmartLinksPanel({
  release,
  spotify,
  bandcamp,
  onSpotifyChange,
  onBandcampChange,
  onTargetsSaved,
  onMessage,
  onReleaseChange,
}: {
  release: StudioRelease;
  spotify: string;
  bandcamp: string;
  onSpotifyChange: (value: string) => void;
  onBandcampChange: (value: string) => void;
  onTargetsSaved: (targets: Record<string, string>) => void;
  onMessage: (message: string) => void;
  onReleaseChange: (release: StudioRelease) => void;
}) {
  const [targets, setTargets] = useState<Record<string, string>>(
    release.smartLinkTargets ?? {},
  );
  const [tracks, setTracks] = useState(release.tracks ?? []);
  const [archive, setArchive] = useState<StudioSound[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState('ALL');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pluginPrefixes, setPluginPrefixes] = useState<Record<string, string>>(
    {},
  );
  const [fillSlug, setFillSlug] = useState('');
  const [pendingRemoveTrack, setPendingRemoveTrack] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setTargets(release.smartLinkTargets ?? {});
    setTracks(release.tracks ?? []);
  }, [release]);

  useEffect(() => {
    void fetchStudioSounds().then((result) => setArchive(result.data));
  }, []);

  useEffect(() => {
    void loadDspPluginPrefixes().then(setPluginPrefixes);
  }, []);

  const filteredSounds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return archive.filter((item) => {
      const matchesType =
        contentType === 'ALL' || item.contentType === contentType;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.artistName, item.genre, item.contentType]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [archive, contentType, query]);

  const saveTargets = async () => {
    const cleaned = Object.fromEntries(
      DSP_SERVICES.map((service) => {
        const raw = targetValue(service.key).trim();
        const url = /^https?:\/\//i.test(raw)
          ? raw
          : isPluginStreamService(service.key)
            ? ''
            : composeDspUrl(dspPrefixes[service.key] ?? '', raw);
        return [service.key, url] as const;
      }).filter(([, url]) => url),
    );
    const result = await patchStudioRelease(release.id, {
      smartLinkTargets: cleaned,
    });
    if (!result.ok) {
      onMessage(result.error);
      return;
    }
    onTargetsSaved(cleaned);
    onMessage('Smart-link targets saved.');
  };

  const moveTrack = async (trackId: string, targetId: string) => {
    if (trackId === targetId) {
      return;
    }
    const from = tracks.findIndex((track) => track.id === trackId);
    const to = tracks.findIndex((track) => track.id === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      return;
    }
    next.splice(to, 0, moved);
    const result = await reorderStudioReleaseTracks(
      release.id,
      next.map((track) => track.id),
    );
    if (!result.ok) {
      onMessage(result.error);
      return;
    }
    setTracks(next.map((track, index) => ({ ...track, position: index + 1 })));
    onReleaseChange({
      ...release,
      tracks: next.map((track, index) => ({ ...track, position: index + 1 })),
    });
  };

  const removeTrack = async (trackId: string) => {
    const result = await removeStudioReleaseTrack(release.id, trackId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const next = tracks.filter((track) => track.id !== trackId);
    setTracks(next.map((track, index) => ({ ...track, position: index + 1 })));
    onReleaseChange({
      ...release,
      tracks: next.map((track, index) => ({ ...track, position: index + 1 })),
    });
    toast.success('Track removed from release.');
  };

  const addSound = async (item: StudioSound) => {
    if (tracks.some((track) => track.soundId === item.id)) {
      return;
    }
    const result = await addStudioReleaseTrack(release.id, {
      title: item.title,
      soundId: item.id,
      durationSec: item.durationSec,
    });
    if (!result.ok) {
      onMessage(result.error);
      return;
    }
    const next = [...tracks, result.data];
    setTracks(next);
    onReleaseChange({ ...release, tracks: next });
    onMessage(`${item.title} added to release.`);
  };

  const dspPrefixes = prefixesForServices(pluginPrefixes);
  const missingPluginDsps = DSP_SERVICES.filter(
    (service) =>
      isPluginStreamService(service.key) && !pluginPrefixes[service.key],
  );

  const targetValue = (key: string) =>
    key === 'spotify'
      ? spotify
      : key === 'bandcamp'
        ? bandcamp
        : (targets[key] ?? '');
  const updateTarget = (key: string, value: string) => {
    if (key === 'spotify') {
      onSpotifyChange(value);
    }
    if (key === 'bandcamp') {
      onBandcampChange(value);
    }
    setTargets((current) => ({ ...current, [key]: value }));
  };

  const fillAllFromPlugins = () => {
    const filled = fillAllDspUrls(dspPrefixes, fillSlug);
    Object.entries(filled).forEach(([key, url]) => updateTarget(key, url));
  };

  return (
    <div className="flex flex-col gap-6">
      <StudioPanel
        title="Smart-link destinations"
        description="Spotify and SoundCloud use the stream URLs from your embed, import, and export plugin settings. Fill all, then edit any link."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Path for every service"
            placeholder="polar-nights"
            value={fillSlug}
            onChange={(event) => setFillSlug(event.target.value)}
            description="Spotify and SoundCloud copy your plugin stream URLs. Other services append this path."
          />
          <Button
            variant="secondary"
            onClick={fillAllFromPlugins}
            disabled={Object.keys(dspPrefixes).length === 0}
          >
            Fill all
          </Button>
        </div>
        {missingPluginDsps.length > 0 ? (
          <p className="text-foreground-secondary mt-2 text-xs">
            Set{' '}
            {missingPluginDsps.map((service) => service.label).join(' and ')} in{' '}
            <Link
              to="/settings/$section"
              params={{ section: 'plugin-store' }}
              search={{ category: 'import' }}
              className="underline underline-offset-2"
            >
              Add-ons
            </Link>{' '}
            (import, embed, or export) to use those plugin stream URLs.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DSP_SERVICES.map((target) => {
            const prefix = dspPrefixes[target.key];
            const value = targetValue(target.key);
            const pluginStream = isPluginStreamService(target.key);
            const showPrefix = Boolean(
              prefix && !pluginStream && !/^https?:\/\//i.test(value.trim()),
            );
            return (
              <Input
                key={target.key}
                label={target.label}
                placeholder={
                  pluginStream
                    ? prefix || 'https://…'
                    : prefix
                      ? 'slug or full URL'
                      : 'https://…'
                }
                value={value}
                onChange={(event) =>
                  updateTarget(target.key, event.target.value)
                }
                startAddon={
                  showPrefix && prefix ? (
                    <span className="truncate" title={prefix}>
                      {displayDspPrefix(prefix)}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SaveButton
            onClick={() => void saveTargets()}
            label="Save destinations"
          />
          <Tooltip content="Open smart link" side="top">
            <Link to="/r/$slug" params={{ slug: release.smartLinkSlug }}>
              <Button
                size="icon-sm"
                variant="text"
                aria-label="Open smart link"
              >
                <ExternalLinkIcon size={16} aria-hidden />
              </Button>
            </Link>
          </Tooltip>
          <span className="text-foreground-secondary text-xs">
            {release.smartLinkViewCount ?? 0} views · /r/{release.smartLinkSlug}
          </span>
        </div>
      </StudioPanel>

      <StudioPanel
        title="Smart-link playlist"
        description="Arrange the release order, play a track, remove it, or add audio from your library."
      >
        {tracks.length === 0 ? (
          <EmptyState
            size="sm"
            title="No tracks yet"
            description="Add tracks from your library to build this release."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {tracks.map((track, index) => (
              <li
                key={track.id}
                draggable
                onDragStart={() => setDraggedId(track.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    void moveTrack(draggedId, track.id);
                  }
                  setDraggedId(null);
                }}
                className="border-border bg-background-secondary/30 flex items-center gap-2 rounded-md border px-2 py-2"
              >
                <GripVerticalIcon
                  size={16}
                  className="text-foreground-secondary shrink-0"
                  aria-label="Drag to reorder"
                />
                <span className="text-foreground-secondary w-5 text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {track.title}
                </span>
                <ReleaseTrackRow track={track} shopUrl={targets.bandcamp} />
                <Tooltip content="Remove from release" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Remove ${track.title}`}
                    onClick={() =>
                      setPendingRemoveTrack({
                        id: track.id,
                        title: track.title,
                      })
                    }
                  >
                    <Trash2Icon size={15} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ol>
        )}
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => setLibraryOpen(true)}
        >
          <PlusIcon size={16} aria-hidden /> Add tracks from library
        </Button>
      </StudioPanel>

      <Dialog.Root isOpen={libraryOpen} onClose={() => setLibraryOpen(false)}>
        <Dialog.Title>Add tracks from library</Dialog.Title>
        <Dialog.Description>
          Search your sounds and add them to this release.
        </Dialog.Description>
        <div className="flex flex-wrap gap-2 py-3">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Type"
            value={contentType}
            onValueChange={setContentType}
            options={[
              { id: 'ALL', label: 'All content' },
              ...[
                ...new Set(
                  archive.map((item) => item.contentType).filter(Boolean),
                ),
              ].map((type) => ({ id: type ?? '', label: type ?? '' })),
            ]}
          />
          <SearchIcon
            size={16}
            className="text-foreground-secondary mt-7"
            aria-hidden
          />
          <FilterIcon
            size={16}
            className="text-foreground-secondary mt-7"
            aria-hidden
          />
        </div>
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {filteredSounds.map((item) => {
            const alreadyAdded = tracks.some(
              (track) => track.soundId === item.id,
            );
            return (
              <button
                key={item.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => void addSound(item)}
                className="border-border hover:bg-background-secondary flex items-center gap-2 rounded border px-3 py-2 text-left text-sm disabled:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="text-foreground-secondary text-xs">
                  {item.contentType ?? 'Sound'}
                </span>
                {alreadyAdded ? (
                  <span className="text-xs">Added</span>
                ) : (
                  <PlusIcon size={15} aria-hidden />
                )}
              </button>
            );
          })}
          {filteredSounds.length === 0 && (
            <p className="text-foreground-secondary py-6 text-sm">
              No library items match.
            </p>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingRemoveTrack !== null}
        title={
          pendingRemoveTrack
            ? `Remove "${pendingRemoveTrack.title}" from this release?`
            : 'Remove track?'
        }
        description="The track leaves this release. It stays in your library."
        confirmLabel="Remove"
        onCancel={() => setPendingRemoveTrack(null)}
        onConfirm={() => {
          const track = pendingRemoveTrack;
          setPendingRemoveTrack(null);
          if (!track) {
            return;
          }
          void removeTrack(track.id);
        }}
      />
    </div>
  );
}
