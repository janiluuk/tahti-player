import { Link } from '@tanstack/react-router';
import {
  ImageIcon,
  ListMusicIcon,
  ListPlusIcon,
  Maximize2Icon,
  Minimize2Icon,
  MusicIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  FilePicker,
  Input,
  SaveButton,
  Select,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  fetchCollectionGallery,
  fetchEditorSource,
  fetchStudioCollection,
  fetchStudioSounds,
  patchCollectionGallery,
  patchStudioCollection,
  removeStudioCollectionItem,
  reorderStudioCollectionItems,
  uploadCollectionCover,
} from '../../api/studio';
import type {
  StudioCollection,
  StudioCollectionItem,
  StudioSound,
} from '../../api/studio-types';
import type { TahtiPlayable } from '../../api/types';
import { uploadUserMediaFile } from '../../api/user-media';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../components/EntitySocialHeader';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { WaveformCanvas } from '../../components/WaveformCanvas';
import { COLLECTION_STYLES } from '../../content/collectionStyles';
import { playableFromStudioHearthis } from '../../lib/embedPlayback';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
} from '../../lib/embedSrc';
import { usePlayerStore } from '../../stores/playerStore';
import { LibrarySectionTabs } from '../LibraryView';

const PEAK_BUCKETS = 200;

function formatDuration(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) {
    return '';
  }
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function trackTitle(item: StudioCollectionItem): string {
  return item.sound?.title ?? item.release?.title ?? item.id;
}

/** Decodes a track's audio in-browser into a bucketed peaks array the
 * first time its row expands — same "attempt then degrade" approach as
 * the pro editor's own waveform decode, just scoped to one track. */
function useTrackPeaks(soundId: string | undefined, enabled: boolean) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !soundId || peaks.length > 0) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const { data } = await fetchEditorSource(soundId);
        const res = await fetch(data.url);
        const buf = await res.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(buf.slice(0));
        await ctx.close();
        if (cancelled) {
          return;
        }
        const channel = decoded.getChannelData(0);
        const block = Math.floor(channel.length / PEAK_BUCKETS) || 1;
        const next: number[] = [];
        for (let i = 0; i < PEAK_BUCKETS; i++) {
          let peak = 0;
          const start = i * block;
          for (let j = 0; j < block && start + j < channel.length; j++) {
            peak = Math.max(peak, Math.abs(channel[start + j]!));
          }
          next.push(peak);
        }
        const max = Math.max(...next, 0.001);
        setPeaks(next.map((v) => v / max));
      } catch {
        // Row falls back to a plain progress bar when decode fails.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, soundId, peaks.length]);

  return { peaks, loading };
}

function TrackRow({
  item,
  idx,
  isExpanded,
  isCurrent,
  isPlaying,
  isDragging,
  reorderable,
  currentTime,
  onToggleExpand,
  onPlay,
  onSeek,
  onDragStart,
  onDragEnd,
  onDrop,
  onRemove,
  genre,
}: {
  item: StudioCollectionItem;
  idx: number;
  isExpanded: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  isDragging: boolean;
  reorderable: boolean;
  currentTime: number;
  onToggleExpand: () => void;
  onPlay: () => void;
  onSeek: (sec: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onRemove: () => void;
  genre?: string | null;
}) {
  const { peaks } = useTrackPeaks(item.sound?.id, isExpanded);
  const durationSec = item.sound?.durationSec ?? 0;
  // EMBED_ONLY items have no audio of ours to play or draw a waveform from.
  const embedProvider = item.sound?.embedProvider ?? null;
  const embedUri = item.sound?.embedUri ?? null;
  const isEmbed = Boolean(embedProvider && embedUri);

  return (
    <li
      draggable={reorderable}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={`${idx % 2 === 1 ? 'bg-background-secondary/40' : ''} ${
        isCurrent ? 'border-l-primary bg-primary/10' : 'border-l-transparent'
      } ${reorderable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging ? 'opacity-50' : ''
      } hover:bg-primary/5 border-l-4 transition-colors`}
    >
      <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
        <span
          className={`min-w-0 flex-1 truncate font-medium ${
            isCurrent ? 'text-accent-green' : ''
          }`}
        >
          {trackTitle(item)}
        </span>
        {isEmbed && (
          <span className="text-foreground-secondary shrink-0 font-mono text-[10px] tracking-wide uppercase">
            {EMBED_PROVIDER_LABEL[embedProvider!]}
          </span>
        )}
        {genre ? (
          <span className="text-foreground-secondary shrink-0 text-xs">
            {genre}
          </span>
        ) : null}
        <span className="text-foreground-secondary text-xs tabular-nums">
          {formatDuration(durationSec)}
        </span>
        {item.sound && !isEmbed && (
          <Tooltip
            content={
              isCurrent && isPlaying ? 'Pause' : `Play ${trackTitle(item)}`
            }
            side="top"
          >
            <Button
              size="icon-sm"
              variant="text"
              aria-label={
                isCurrent && isPlaying ? 'Pause' : `Play ${trackTitle(item)}`
              }
              onClick={onPlay}
            >
              {isCurrent && isPlaying ? (
                <PauseIcon size={16} aria-hidden />
              ) : (
                <PlayIcon size={16} aria-hidden />
              )}
            </Button>
          </Tooltip>
        )}
        {item.sound && isEmbed && (
          <Tooltip
            content={
              isExpanded
                ? 'Hide player'
                : `Play ${trackTitle(item)} on ${EMBED_PROVIDER_LABEL[embedProvider!]}`
            }
            side="top"
          >
            <Button
              size="icon-sm"
              variant="text"
              aria-label={
                isExpanded
                  ? 'Hide player'
                  : `Play ${trackTitle(item)} on ${EMBED_PROVIDER_LABEL[embedProvider!]}`
              }
              onClick={onToggleExpand}
            >
              <PlayIcon size={16} className="fill-current" aria-hidden />
            </Button>
          </Tooltip>
        )}
        {item.sound && !isEmbed && (
          <Tooltip
            content={
              isExpanded
                ? 'Collapse'
                : isEmbed
                  ? 'Show player'
                  : 'Expand waveform'
            }
            side="top"
          >
            <Button
              size="icon-sm"
              variant="text"
              aria-label={
                isExpanded
                  ? 'Collapse'
                  : isEmbed
                    ? 'Show player'
                    : 'Expand waveform'
              }
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <Minimize2Icon size={14} aria-hidden />
              ) : (
                <Maximize2Icon size={14} aria-hidden />
              )}
            </Button>
          </Tooltip>
        )}
        <Tooltip content="Remove track" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label="Remove track"
            onClick={onRemove}
          >
            <Trash2Icon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>

      {isExpanded && isEmbed && (
        <div className="px-3 pb-3">
          <iframe
            title={trackTitle(item)}
            src={embedSrcFor(embedProvider!, embedUri!) ?? ''}
            width="100%"
            height={EMBED_PROVIDER_HEIGHT[embedProvider!]}
            style={{ border: 0, display: 'block' }}
            allow="autoplay; encrypted-media"
            loading="lazy"
            className="border-border overflow-hidden rounded-lg border"
          />
        </div>
      )}

      {isExpanded && item.sound && !isEmbed && (
        <div className="px-3 pb-3">
          {durationSec > 0 && peaks.length > 0 ? (
            <div className="border-border bg-background h-24 overflow-hidden rounded-lg border">
              <WaveformCanvas
                peaks={peaks}
                durationSec={durationSec}
                currentTime={isCurrent ? currentTime : 0}
                cuts={[]}
                selection={null}
                onSeek={onSeek}
              />
            </div>
          ) : (
            <div className="border-border bg-background text-foreground-secondary flex h-24 items-center justify-center rounded-lg border text-xs">
              Decoding waveform…
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function StudioCollectionEditView({
  slug,
  nav = 'studio',
}: {
  slug: string;
  /** Which top navigation this page was reached through. */
  nav?: 'studio' | 'library';
}) {
  const [col, setCol] = useState<StudioCollection | null>(null);
  const [archive, setArchive] = useState<StudioSound[]>([]);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [addBusyId, setAddBusyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('ALBUM');
  const [visibility, setVisibility] = useState<
    'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  >('PUBLIC');
  const [releaseDate, setReleaseDate] = useState('');
  const [genres, setGenres] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);
  /** More than one entry here means the backdrop is a slideshow, not a
   * single still — saved together with the rest of the form via the
   * gallery endpoint (see saveMeta). */
  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'backdrop' | null>(
    null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [archiveQuery, setArchiveQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const isPlaying = status === 'playing' || status === 'loading';

  const reload = () => {
    void Promise.all([
      fetchStudioCollection(slug),
      fetchStudioSounds(),
      fetchCollectionGallery(slug),
    ]).then(([c, a, g]) => {
      setCol(c.data);
      setArchive(a.data);
      setName(c.data.name);
      setDescription(c.data.description ?? '');
      setStyle(c.data.style ?? c.data.type ?? 'ALBUM');
      setVisibility(
        c.data.visibility ?? (c.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      );
      setReleaseDate(c.data.releaseDate ?? '');
      setGenres((c.data.genres ?? []).join(', '));
      setCoverUrl(c.data.coverUrl ?? null);
      setBackdropUrl(g.data.slideshowImages[0] ?? c.data.backdropUrl ?? null);
      setSlideshowImages(
        g.data.slideshowImages.length > 0
          ? g.data.slideshowImages
          : c.data.backdropUrl
            ? [c.data.backdropUrl]
            : [],
      );
    });
  };

  useEffect(() => {
    reload();
  }, [slug]);

  const items = col?.items ?? [];
  const isAlbumLike = useMemo(
    () => ['ALBUM', 'EP', 'SINGLE'].includes(style),
    [style],
  );

  const headerStats: EntitySocialStat[] =
    items.length > 0
      ? [
          {
            key: 'tracks',
            label: 'Tracks',
            value: items.length,
            icon: MusicIcon,
          },
        ]
      : [];

  const filteredItems = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((item) => trackTitle(item).toLowerCase().includes(q));
  }, [items, trackQuery]);

  const filteredSounds = useMemo(() => {
    const query = archiveQuery.trim().toLowerCase();
    if (!query) {
      return archive;
    }
    return archive.filter((item) =>
      [item.title, item.genre, item.contentType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [archive, archiveQuery]);
  const existingArchiveIds = useMemo(
    () => new Set(items.map((item) => item.sound?.id).filter(Boolean)),
    [items],
  );
  const availableSounds = filteredSounds.filter(
    (sound) => !existingArchiveIds.has(sound.id),
  );

  const nowPlayingItem = items.find(
    (i) => i.sound && currentId === `archive:${i.sound.id}`,
  );

  type PlayableSound = {
    id: string;
    title: string;
    artistName?: string | null;
    bannerUrl?: string | null;
    embedProvider?: string | null;
    embedUri?: string | null;
    durationSec?: number | null;
  };

  /** Non-hearthis EMBED_ONLY sounds have no Tahti-hosted audio and no
   * shared-player widget to build a playable from. */
  const buildPlayable = async (
    sound: PlayableSound,
  ): Promise<TahtiPlayable | null> => {
    const hearthis = playableFromStudioHearthis(sound);
    if (hearthis) {
      return hearthis;
    }
    if (sound.embedProvider && sound.embedProvider !== 'HEARTHIS') {
      return null;
    }
    const { data } = await fetchEditorSource(sound.id);
    return {
      id: `archive:${sound.id}`,
      kind: 'archive',
      title: data.title || sound.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    };
  };

  const playSound = async (sound: PlayableSound) => {
    const playable = await buildPlayable(sound);
    if (playable) {
      play(playable);
    }
  };

  const playAllTracks = async () => {
    const first = items.find((item) => item.sound);
    if (!first?.sound) {
      return;
    }
    await playSound(first.sound);
  };

  const queueAllTracks = async () => {
    const withSound = items.filter(
      (item): item is StudioCollectionItem & { sound: StudioSound } =>
        Boolean(item.sound),
    );
    let queued = 0;
    for (const item of withSound) {
      const playable = await buildPlayable(item.sound);
      if (playable) {
        enqueue(playable);
        queued += 1;
      }
    }
    if (queued === 0) {
      toast.info('No playable tracks to queue.');
    } else {
      toast.success(
        `Added ${queued} track${queued === 1 ? '' : 's'} to the queue.`,
      );
    }
  };

  const togglePlayItem = (item: StudioCollectionItem) => {
    // Non-hearthis EMBED_ONLY items have no Tahti-hosted audio and no
    // shared-player widget — only HEARTHIS plays via the bottom bar.
    if (
      !item.sound ||
      (item.sound.embedProvider && item.sound.embedProvider !== 'HEARTHIS')
    ) {
      return;
    }
    const isThisCurrent = currentId === `archive:${item.sound.id}`;
    if (isThisCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    void playSound(item.sound);
  };

  const addSound = async (sound: StudioSound) => {
    setAddBusyId(sound.id);
    const result = await addStudioCollectionItem(slug, sound.id);
    setAddBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${sound.title} added.`);
    reload();
  };

  const reorderByDrop = async (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }
    const fromIndex = items.findIndex((candidate) => candidate.id === fromId);
    const toIndex = items.findIndex((candidate) => candidate.id === toId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    next.splice(toIndex, 0, moved);
    setCol((c) => (c ? { ...c, items: next } : c));
    const result = await reorderStudioCollectionItems(
      slug,
      next.map((i) => i.id),
    );
    if (result.ok) {
      toast.success('Tracklist reordered.');
    } else {
      toast.error(result.error);
      reload();
    }
  };

  const saveMeta = async () => {
    setSaving(true);
    const result = await patchStudioCollection(slug, {
      name: name.trim() || slug,
      description: description.trim() || null,
      style,
      isPublic: visibility === 'PUBLIC',
      visibility,
      releaseDate: releaseDate || null,
      genres: genres
        .split(',')
        .map((genre) => genre.trim())
        .filter(Boolean)
        .slice(0, 5),
      backdropUrl: backdropUrl?.trim() || null,
    });
    if (!result.ok) {
      setSaving(false);
      toast.error(result.error);
      return;
    }
    const galleryResult = await patchCollectionGallery(slug, {
      slideshowImages,
      galleryMode: slideshowImages.length > 1 ? 'STATIC_SLIDESHOW' : 'NONE',
    });
    setSaving(false);
    if (!galleryResult.ok) {
      toast.error(galleryResult.error);
      return;
    }
    setCol((c) =>
      c
        ? {
            ...c,
            ...result.data,
            items: c.items,
            coverUrl: coverUrl ?? result.data.coverUrl,
          }
        : result.data,
    );
    toast.success('Collection details saved.');
  };

  const uploadImage = async (files: readonly File[]) => {
    if (files.length === 0 || !uploadTarget) {
      return;
    }
    setUploadingImage(true);
    if (uploadTarget === 'cover') {
      const result = await uploadCollectionCover(slug, files[0]!);
      setUploadingImage(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCoverUrl(result.coverUrl);
      setCol((current) =>
        current ? { ...current, coverUrl: result.coverUrl } : current,
      );
      setUploadTarget(null);
      toast.success('Cover uploaded.');
      return;
    }

    // Backdrop accepts one image (a still) or several (a slideshow) —
    // upload them all, then stage the URLs locally; they're saved together
    // with the rest of the form (see saveMeta).
    const uploaded: string[] = [];
    for (const file of files) {
      const result = await uploadUserMediaFile(file);
      if (!result.ok) {
        setUploadingImage(false);
        toast.error(result.error);
        return;
      }
      uploaded.push(result.data.url);
    }
    setUploadingImage(false);
    setBackdropUrl(uploaded[0]!);
    setSlideshowImages(uploaded);
    setUploadTarget(null);
    toast.success(
      uploaded.length > 1
        ? `${uploaded.length} backdrop images uploaded. Save details to publish them.`
        : 'Backdrop uploaded. Save details to publish it.',
    );
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
        {nav === 'library' ? (
          <LibrarySectionTabs active="collections" />
        ) : (
          <StudioNav current="/studio/collections" />
        )}
        <Link
          to={
            nav === 'library' ? '/library/collections' : '/studio/collections'
          }
          className="text-foreground-secondary -mt-2 text-xs hover:underline"
        >
          ← Collections
        </Link>
        {!col ? (
          <StudioPanel>
            <PageLoading label="Loading…" />
          </StudioPanel>
        ) : (
          <>
            <EntitySocialHeader
              title={name || col.name}
              imageUrl={coverUrl}
              imageAlt=""
              onImageClick={() => setUploadTarget('cover')}
              backdropUrl={backdropUrl}
              subtitle={
                <>
                  {COLLECTION_STYLES.find((s) => s.id === style)?.label ??
                    style}
                  {slideshowImages.length > 1
                    ? ` · ${slideshowImages.length}-image backdrop slideshow`
                    : ''}
                </>
              }
              description={description.trim() || undefined}
              stats={headerStats}
              actions={
                <>
                  <Tooltip content="Change backdrop" side="top">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="bg-background border-border rounded-md border-(length:--border-width)"
                      aria-label="Change backdrop"
                      onClick={() => setUploadTarget('backdrop')}
                    >
                      <ImageIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Badge
                    variant="pill"
                    color={visibility === 'PUBLIC' ? 'green' : 'secondary'}
                  >
                    {visibility.charAt(0) + visibility.slice(1).toLowerCase()}
                  </Badge>
                  <SaveButton saving={saving} onClick={() => void saveMeta()} />
                </>
              }
              data-testid="studio-collection-social-header"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void playAllTracks()}
                  disabled={items.length === 0}
                >
                  <PlayIcon size={16} aria-hidden className="mr-1.5" />
                  Play
                </Button>
                <Tooltip content="Add all to queue" side="top">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => void queueAllTracks()}
                    disabled={items.length === 0}
                    aria-label="Add all to queue"
                  >
                    <ListPlusIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip
                  content={`Add content to ${isAlbumLike ? 'album' : 'collection'}`}
                  side="top"
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label={`Add content to ${isAlbumLike ? 'album' : 'collection'}`}
                    onClick={() => setAddPickerOpen(true)}
                  >
                    <PlusIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            </EntitySocialHeader>

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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Title"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <label className="flex flex-col gap-1 text-sm">
                    Release date
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(event) => setReleaseDate(event.target.value)}
                      className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                    />
                  </label>
                  <Input
                    label="Genres"
                    value={genres}
                    placeholder="Electronic, Ambient"
                    onChange={(event) => setGenres(event.target.value)}
                  />
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-foreground-secondary text-xs uppercase">
                      Style
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {COLLECTION_STYLES.map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          variant="text"
                          size="flexible"
                          aria-pressed={style === s.id}
                          className={`rounded-md border px-3 py-1 text-xs ${
                            style === s.id
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border text-foreground-secondary'
                          }`}
                          onClick={() => setStyle(s.id)}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </label>
                  <label className="flex flex-col gap-1 text-sm sm:col-span-2">
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
                  <section className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-lg border p-3 sm:col-span-2">
                    <Select
                      label="Visibility"
                      description="Choose who can find this collection."
                      value={visibility}
                      onValueChange={(value) =>
                        setVisibility(value as typeof visibility)
                      }
                      options={[
                        { id: 'PUBLIC', label: 'Public' },
                        {
                          id: 'UNLISTED',
                          label: 'Unlisted — direct link only',
                        },
                        { id: 'PRIVATE', label: 'Private — only you' },
                      ]}
                    />
                  </section>
                </div>
              ) : (
                <p className="text-foreground-secondary text-sm">
                  {releaseDate || genres.trim()
                    ? [
                        releaseDate ? `Release ${releaseDate}` : null,
                        genres.trim() || null,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : 'No release date or genres set yet.'}
                </p>
              )}
            </StudioPanel>

            <StudioPanel
              title={isAlbumLike ? 'Tracklist' : 'Items'}
              description={`${items.length} track${items.length === 1 ? '' : 's'}`}
            >
              <div className="mb-3 flex flex-col gap-3">
                <Input
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Search tracks…"
                  className="max-w-xs"
                  aria-label="Search tracks"
                />

                {nowPlayingItem?.sound && (
                  <div className="border-border bg-background-input flex items-center gap-3 rounded-lg border px-3 py-2">
                    <Tooltip content={isPlaying ? 'Pause' : 'Play'} side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                        onClick={() =>
                          setStatus(isPlaying ? 'paused' : 'playing')
                        }
                      >
                        {isPlaying ? (
                          <PauseIcon size={16} aria-hidden />
                        ) : (
                          <PlayIcon size={16} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                    <span className="truncate text-sm font-medium">
                      {nowPlayingItem.sound.title}
                    </span>
                    <div
                      className="border-border bg-background relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full border"
                      onClick={(e) => {
                        if (duration <= 0) {
                          return;
                        }
                        const rect = e.currentTarget.getBoundingClientRect();
                        const frac = (e.clientX - rect.left) / rect.width;
                        seekTo(Math.max(0, Math.min(1, frac)) * duration);
                      }}
                    >
                      <div
                        className="bg-accent-green absolute inset-y-0 left-0"
                        style={{
                          width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>
                )}
              </div>

              {items.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No tracks yet — add archive items below."
                />
              ) : (
                <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                  {filteredItems.length === 0 && (
                    <li className="text-foreground-secondary py-3 text-sm">
                      No tracks match “{trackQuery}”.
                    </li>
                  )}
                  {filteredItems.map((item) => {
                    const idx = items.indexOf(item);
                    const isCurrent = Boolean(
                      item.sound && currentId === `archive:${item.sound.id}`,
                    );
                    return (
                      <TrackRow
                        key={item.id}
                        item={item}
                        idx={idx}
                        isExpanded={expandedItemId === item.id}
                        isCurrent={isCurrent}
                        isPlaying={isCurrent && isPlaying}
                        currentTime={currentTime}
                        onToggleExpand={() =>
                          setExpandedItemId((cur) =>
                            cur === item.id ? null : item.id,
                          )
                        }
                        onPlay={() => togglePlayItem(item)}
                        onSeek={(sec) => {
                          if (isCurrent) {
                            seekTo(sec);
                          } else if (item.sound) {
                            void playSound(item.sound);
                          }
                        }}
                        isDragging={draggedId === item.id}
                        reorderable={!trackQuery.trim()}
                        onDragStart={() => setDraggedId(item.id)}
                        onDragEnd={() => setDraggedId(null)}
                        onDrop={() => {
                          if (draggedId) {
                            void reorderByDrop(draggedId, item.id);
                          }
                          setDraggedId(null);
                        }}
                        genre={
                          item.sound?.genre ??
                          archive.find((sound) => sound.id === item.sound?.id)
                            ?.genre
                        }
                        onRemove={() => {
                          void removeStudioCollectionItem(slug, item.id).then(
                            () => reload(),
                          );
                        }}
                      />
                    );
                  })}
                </ul>
              )}
            </StudioPanel>
          </>
        )}
        <Dialog.Root
          isOpen={addPickerOpen}
          onClose={() => setAddPickerOpen(false)}
          className="max-w-4xl"
        >
          <Dialog.Title>
            Add content to {isAlbumLike ? 'album' : 'collection'}
          </Dialog.Title>
          <Dialog.Description>
            Choose library content to add. Tracks already in this collection are
            hidden.
          </Dialog.Description>
          <div className="mt-4 grid min-h-96 gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
            <nav
              aria-label="Library content types"
              className="border-border flex gap-1 overflow-x-auto border-b pb-2 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:pr-3"
            >
              <Button
                variant="secondary"
                className="justify-start whitespace-nowrap"
                aria-current="page"
              >
                <ListMusicIcon size={15} aria-hidden className="mr-2" />
                Tracks
              </Button>
              {['Releases', 'Collections', 'Playlists'].map((type) => (
                <Button
                  key={type}
                  variant="text"
                  className="justify-start whitespace-nowrap opacity-50"
                  disabled
                >
                  {type}
                </Button>
              ))}
            </nav>
            <div className="flex min-w-0 flex-col gap-3">
              <Input
                value={archiveQuery}
                onChange={(event) => setArchiveQuery(event.target.value)}
                placeholder="Search tracks by title, genre, or type…"
                aria-label="Search library tracks"
                endAddon={<SearchIcon size={16} aria-hidden />}
              />
              <div className="border-border min-h-0 overflow-auto rounded-md border">
                {availableSounds.length === 0 ? (
                  <p className="text-foreground-secondary p-4 text-sm">
                    {archiveQuery.trim()
                      ? 'No available tracks match your search.'
                      : 'All library tracks are already in this collection.'}
                  </p>
                ) : (
                  <ul aria-label="Available library tracks">
                    {availableSounds.map((sound, index) => {
                      const itemIsPlaying =
                        currentId === `archive:${sound.id}` && isPlaying;
                      return (
                        <li
                          key={sound.id}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm ${index % 2 === 1 ? 'bg-background-secondary/40' : 'bg-background'}`}
                        >
                          <Tooltip
                            content={`${itemIsPlaying ? 'Pause' : 'Preview'} ${sound.title}`}
                            side="top"
                          >
                            <Button
                              size="icon-sm"
                              variant={itemIsPlaying ? 'secondary' : 'text'}
                              aria-label={`${itemIsPlaying ? 'Pause' : 'Preview'} ${sound.title}`}
                              onClick={() => {
                                if (itemIsPlaying) {
                                  setStatus('paused');
                                } else {
                                  void playSound(sound);
                                }
                              }}
                            >
                              {itemIsPlaying ? (
                                <PauseIcon size={15} aria-hidden />
                              ) : (
                                <PlayIcon size={15} aria-hidden />
                              )}
                            </Button>
                          </Tooltip>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {sound.title}
                            </p>
                            <p className="text-foreground-secondary truncate text-xs">
                              {sound.artistName ?? 'Unknown artist'}
                              {sound.genre ? ` · ${sound.genre}` : ''}
                              {sound.durationSec
                                ? ` · ${formatDuration(sound.durationSec)}`
                                : ''}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={addBusyId === sound.id}
                            onClick={() => void addSound(sound)}
                          >
                            <PlusIcon size={15} aria-hidden className="mr-1" />
                            {addBusyId === sound.id ? 'Adding…' : 'Add'}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <Dialog.Actions>
            <Dialog.Close>Done</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>
        <Dialog.Root
          isOpen={uploadTarget !== null}
          onClose={() => {
            if (!uploadingImage) {
              setUploadTarget(null);
            }
          }}
        >
          <Dialog.Title>
            Upload {uploadTarget === 'cover' ? 'cover' : 'backdrop'}
          </Dialog.Title>
          <Dialog.Description>
            {uploadTarget === 'cover'
              ? "Choose an image for this collection's cover art."
              : 'Choose one image for a still backdrop, or several for a slideshow.'}
          </Dialog.Description>
          <div className="mt-4">
            <FilePicker
              labels={{
                title:
                  uploadTarget === 'cover' ? 'Cover image' : 'Backdrop images',
                description: 'JPEG, PNG, WebP, or GIF',
                browse: uploadingImage
                  ? 'Uploading…'
                  : uploadTarget === 'cover'
                    ? 'Choose image'
                    : 'Choose image(s)',
              }}
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple={uploadTarget === 'backdrop'}
              disabled={uploadingImage}
              onFiles={(files) => void uploadImage(files)}
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>
      </div>
    </StudioGate>
  );
}
