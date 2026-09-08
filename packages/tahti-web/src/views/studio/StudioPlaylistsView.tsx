import { Link } from '@tanstack/react-router';
import {
  GlobeIcon,
  ListMusicIcon,
  LockIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Track } from '@tahti-player/model';
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  FilePicker,
  Input,
  MediaArtwork,
  SaveButton,
  Select,
  Textarea,
  Toggle,
  Tooltip,
  TrackTable,
  ViewShell,
} from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  createStudioCollection,
  fetchEditorSource,
  fetchStudioCollection,
  fetchStudioCollections,
  fetchStudioReleases,
  fetchStudioSounds,
  patchStudioCollection,
  removeStudioCollectionItem,
  reorderStudioCollectionItems,
  uploadCollectionCover,
} from '../../api/studio';
import type {
  StudioCollection,
  StudioRelease,
  StudioSound,
} from '../../api/studio-types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../components/EntitySocialHeader';
import { PageLoading } from '../../components/PageStates';
import { StudioCollectionMoreMenu } from '../../components/StudioCollectionMoreMenu';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { normalizeCollectionStyle } from '../../content/collectionStyles';
import { collectionItemToTrack } from '../../lib/collectionTrackMapping';
import { playableFromStudioHearthis } from '../../lib/embedPlayback';
import { trackTableLabels } from '../../lib/trackTableLabels';
import { usePlayerStore } from '../../stores/playerStore';

function isPlaylist(c: StudioCollection) {
  return !c.style || c.style === 'PLAYLIST' || c.style === 'CUSTOM';
}

export function StudioPlaylistsView() {
  const [rows, setRows] = useState<StudioCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [collaborative, setCollaborative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchStudioCollections().then((res) => {
      setRows(res.data.filter(isPlaylist));
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!name.trim()) {
      return;
    }
    setBusy(true);
    const r = await createStudioCollection({
      name: name.trim(),
      style: 'PLAYLIST',
      isPublic,
      collaborative: isPublic && collaborative,
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setCreateOpen(false);
    setName('');
    reload();
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/playlists" />
        <ViewShell
          title="Playlists"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="New playlist" side="top">
              <Button
                size="icon-sm"
                onClick={() => setCreateOpen(true)}
                aria-label="New playlist"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          }
        >
          <nav className="flex flex-wrap gap-2" aria-label="Collection views">
            <Link to="/studio/collections">
              <Button size="sm" variant="secondary">
                Collections
              </Button>
            </Link>
            <Button size="sm" variant="default" aria-current="page">
              Playlists
            </Button>
          </nav>

          {msg && (
            <p className="text-foreground-secondary px-1 text-sm">{msg}</p>
          )}

          <Dialog.Root isOpen={createOpen} onClose={() => setCreateOpen(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <Dialog.Title>New playlist</Dialog.Title>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>Public on profile</span>
                  <Toggle
                    label="Public on profile"
                    checked={isPublic}
                    onChange={(checked) => {
                      setIsPublic(checked);
                      if (!checked) {
                        setCollaborative(false);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>Others can add tracks</span>
                  <Toggle
                    label="Others can add tracks"
                    checked={collaborative}
                    disabled={!isPublic}
                    onChange={setCollaborative}
                  />
                </div>
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
                <Button type="submit" disabled={busy || !name.trim()}>
                  Create
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<ListMusicIcon size={40} className="opacity-40" />}
                title="No playlists yet"
                description="Create a playlist to organize tracks and releases."
                action={
                  <Tooltip content="New playlist" side="top">
                    <Button
                      size="icon-sm"
                      onClick={() => setCreateOpen(true)}
                      aria-label="New playlist"
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                }
              />
            ) : (
              <ul className="divide-border divide-y">
                {rows.map((c) => (
                  <li
                    key={c.slug}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <MediaArtwork
                      size="thumb"
                      src={c.coverUrl}
                      alt=""
                      className="border-border bg-background rounded-lg border shadow-sm"
                      placeholder={
                        <ListMusicIcon size={20} className="opacity-40" />
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/studio/collections/$slug"
                        params={{ slug: c.slug }}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-foreground-secondary flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1">
                          {c.isPublic === false ? (
                            <LockIcon size={12} aria-hidden />
                          ) : (
                            <GlobeIcon size={12} aria-hidden />
                          )}
                          {c.isPublic === false ? 'Private' : 'Public'}
                        </span>
                        {c.collaborative ? (
                          <span className="inline-flex items-center gap-1">
                            <UsersIcon size={12} aria-hidden />
                            Collaborative
                          </span>
                        ) : null}
                        {typeof c.itemCount === 'number'
                          ? `, ${c.itemCount} items`
                          : c.items
                            ? `, ${c.items.length} items`
                            : ''}
                      </p>
                    </div>
                    <Link
                      to="/studio/collections/$slug"
                      params={{ slug: c.slug }}
                    >
                      <Button size="sm">Edit</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}

export function StudioPlaylistEditorView({ slug }: { slug: string }) {
  const [col, setCol] = useState<StudioCollection | null>(null);
  const [archive, setArchive] = useState<StudioSound[]>([]);
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [collaborative, setCollaborative] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addArchiveId, setAddArchiveId] = useState('');
  const [addReleaseId, setAddReleaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingCoverDelete, setPendingCoverDelete] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);
  const isDjSet = normalizeCollectionStyle(col?.style) === 'DJ_SET_SERIES';
  const kindLabel = isDjSet ? 'DJ set' : 'playlist';

  const reload = () => {
    void Promise.all([
      fetchStudioCollection(slug),
      fetchStudioSounds(),
      fetchStudioReleases(),
    ]).then(([c, a, r]) => {
      setCol(c.data);
      setName(c.data.name);
      setDescription(c.data.description ?? '');
      setIsPublic(c.data.isPublic !== false);
      setCollaborative(Boolean(c.data.collaborative));
      setCoverUrl(c.data.coverUrl ?? null);
      setArchive(a.data);
      setReleases(r.data.releases);
    });
  };

  useEffect(() => {
    reload();
  }, [slug]);

  const items = col?.items ?? [];
  const tracks: Track[] = useMemo(
    () => items.map(collectionItemToTrack),
    [items],
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

  const saveMeta = async () => {
    setSaving(true);
    const r = await patchStudioCollection(slug, {
      name: name.trim() || slug,
      description: description.trim() || null,
      isPublic,
      collaborative: !isDjSet && isPublic && collaborative,
      style: isDjSet ? 'DJ_SET_SERIES' : 'PLAYLIST',
    });
    setSaving(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg(`${isDjSet ? 'DJ set' : 'Playlist'} settings saved.`);
    reload();
  };

  const uploadCover = async (files: readonly File[]) => {
    if (files.length === 0) {
      return;
    }
    setUploadingImage(true);
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
    setUploadOpen(false);
    toast.success('Cover uploaded.');
  };

  const removeCover = async () => {
    const result = await patchStudioCollection(slug, { coverUrl: null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCoverUrl(null);
    setCol((current) => (current ? { ...current, coverUrl: null } : current));
    toast.success('Cover removed.');
  };

  const playSound = async (sound: {
    id: string;
    title: string;
    artistName?: string | null;
    bannerUrl?: string | null;
    embedProvider?: string | null;
    embedUri?: string | null;
    durationSec?: number | null;
  }) => {
    const hearthis = playableFromStudioHearthis(sound);
    if (hearthis) {
      play(hearthis);
      return;
    }
    const { data } = await fetchEditorSource(sound.id);
    play({
      id: `archive:${sound.id}`,
      kind: 'archive',
      title: data.title || sound.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const enqueueSound = async (sound: {
    id: string;
    title: string;
    artistName?: string | null;
    bannerUrl?: string | null;
    embedProvider?: string | null;
    embedUri?: string | null;
    durationSec?: number | null;
  }) => {
    const hearthis = playableFromStudioHearthis(sound);
    if (hearthis) {
      enqueue(hearthis);
      return;
    }
    const { data } = await fetchEditorSource(sound.id);
    enqueue({
      id: `archive:${sound.id}`,
      kind: 'archive',
      title: data.title || sound.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const playFirstTrack = async () => {
    const first = items.find((item) => item.sound);
    if (first?.sound) {
      await playSound(first.sound);
    }
  };

  const onReorder = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      return;
    }
    next.splice(to, 0, moved);
    setCol((c) => (c ? { ...c, items: next } : c));
    void reorderStudioCollectionItems(
      slug,
      next.map((i) => i.id),
    ).then((r) => {
      if (!r.ok) {
        setMsg(r.error);
        reload();
      }
    });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/collections" />
        <Link
          to="/studio/collections"
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
              onImageClick={() => setUploadOpen(true)}
              onImageDelete={
                coverUrl ? () => setPendingCoverDelete(true) : undefined
              }
              subtitle={isDjSet ? 'DJ set' : 'Playlist'}
              description={description.trim() || undefined}
              stats={headerStats}
              actions={
                <>
                  <Badge
                    variant="pill"
                    color={isPublic ? 'green' : 'secondary'}
                  >
                    {isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <SaveButton saving={saving} onClick={() => void saveMeta()} />
                </>
              }
              data-testid="studio-playlist-social-header"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void playFirstTrack()}
                  disabled={items.length === 0}
                >
                  <PlayIcon size={16} aria-hidden className="mr-1.5" />
                  Play
                </Button>
                <StudioCollectionMoreMenu col={col} kindLabel={kindLabel} />
              </div>
            </EntitySocialHeader>

            <StudioPanel title="Details">
              <div className="flex flex-col gap-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary text-xs uppercase">
                    Description
                  </span>
                  <Textarea
                    tone="secondary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </label>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>Public on profile</span>
                  <Toggle
                    label="Public on profile"
                    checked={isPublic}
                    onChange={(checked) => {
                      setIsPublic(checked);
                      if (!checked) {
                        setCollaborative(false);
                      }
                    }}
                  />
                </div>
                {!isDjSet ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>Others can add tracks (collaborative)</span>
                    <Toggle
                      label="Others can add tracks (collaborative)"
                      checked={collaborative}
                      disabled={!isPublic}
                      onChange={setCollaborative}
                    />
                  </div>
                ) : null}
              </div>
            </StudioPanel>

            <StudioPanel
              title="Tracks"
              description={`${items.length} item${items.length === 1 ? '' : 's'}`}
            >
              {tracks.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  Empty {kindLabel} — add archive tracks or whole releases
                  below.
                </p>
              ) : (
                <div className="min-h-[200px]">
                  <TrackTable
                    tracks={tracks}
                    labels={trackTableLabels}
                    getItemId={(_t, index) => items[index]?.id ?? String(index)}
                    features={{
                      header: true,
                      reorderable: true,
                      filterable: false,
                      sortable: false,
                    }}
                    display={{
                      displayPosition: false,
                      displayArtist: false,
                      displayDuration: true,
                      displayDeleteButton: true,
                      displayThumbnail: true,
                      displayQueueControls: true,
                    }}
                    actions={{
                      onReorder,
                      onRemove: (t, index) => {
                        const item = items[index];
                        if (!item) {
                          return;
                        }
                        setPendingRemove({ id: item.id, title: t.title });
                      },
                      onPlayNow: (t) => {
                        const item = items.find((i) => i.id === t.source.id);
                        if (item?.sound) {
                          const playableId = `archive:${item.sound.id}`;
                          if (currentId === playableId) {
                            setPlayerStatus(
                              playerStatus === 'playing' ||
                                playerStatus === 'loading'
                                ? 'paused'
                                : 'playing',
                            );
                          } else {
                            void playSound(item.sound);
                          }
                        }
                      },
                      onAddToQueue: (t) => {
                        const item = items.find((i) => i.id === t.source.id);
                        if (item?.sound) {
                          void enqueueSound(item.sound);
                        }
                      },
                    }}
                    meta={{
                      isCurrentTrack: (track) => {
                        const item = items.find(
                          (candidate) => candidate.id === track.source.id,
                        );
                        return Boolean(
                          item?.sound &&
                          currentId === `archive:${item.sound.id}`,
                        );
                      },
                      isTrackPlaying: (track) => {
                        const item = items.find(
                          (candidate) => candidate.id === track.source.id,
                        );
                        return Boolean(
                          item?.sound &&
                          currentId === `archive:${item.sound.id}` &&
                          (playerStatus === 'playing' ||
                            playerStatus === 'loading'),
                        );
                      },
                      isTrackQueued: (track) =>
                        queue.some((queueItem) => {
                          const item = items.find(
                            (candidate) => candidate.id === track.source.id,
                          );
                          return (
                            queueItem.id === track.source.id ||
                            (item?.sound &&
                              queueItem.id === `archive:${item.sound.id}`)
                          );
                        }),
                    }}
                  />
                </div>
              )}

              <div className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Select
                    label="Add from Library"
                    value={addArchiveId}
                    onValueChange={setAddArchiveId}
                    options={[
                      { id: '', label: 'Select track…' },
                      ...archive.map((a) => ({ id: a.id, label: a.title })),
                    ]}
                  />
                  <Button
                    size="sm"
                    disabled={!addArchiveId}
                    onClick={() => {
                      void addStudioCollectionItem(slug, {
                        soundId: addArchiveId,
                      }).then((r) => {
                        setMsg(r.ok ? 'Track added.' : r.error);
                        if (r.ok) {
                          setAddArchiveId('');
                          reload();
                        }
                      });
                    }}
                  >
                    Add track
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Select
                    label="Add release"
                    value={addReleaseId}
                    onValueChange={setAddReleaseId}
                    options={[
                      { id: '', label: 'Select release…' },
                      ...releases.map((r) => ({ id: r.id, label: r.title })),
                    ]}
                  />
                  <Button
                    size="sm"
                    disabled={!addReleaseId}
                    onClick={() => {
                      void addStudioCollectionItem(slug, {
                        releaseId: addReleaseId,
                      }).then((r) => {
                        setMsg(r.ok ? 'Release added.' : r.error);
                        if (r.ok) {
                          setAddReleaseId('');
                          reload();
                        }
                      });
                    }}
                  >
                    Add release
                  </Button>
                </div>
              </div>
            </StudioPanel>

            {msg && <p className="text-sm">{msg}</p>}
          </>
        )}

        <Dialog.Root
          isOpen={uploadOpen}
          onClose={() => {
            if (!uploadingImage) {
              setUploadOpen(false);
            }
          }}
        >
          <Dialog.Title>Upload cover</Dialog.Title>
          <Dialog.Description>
            Choose an image for this {kindLabel}&apos;s cover art.
          </Dialog.Description>
          <div className="mt-4">
            <FilePicker
              labels={{
                title: 'Cover image',
                description: 'JPEG, PNG, WebP, or GIF',
                browse: uploadingImage ? 'Uploading…' : 'Choose image',
              }}
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploadingImage}
              onFiles={(files) => void uploadCover(files)}
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>

        <ConfirmDialog
          isOpen={pendingRemove !== null}
          title={`Remove "${pendingRemove?.title}"?`}
          description={`This removes the track from this ${kindLabel}. It stays in your library.`}
          confirmLabel="Remove"
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => {
            if (!pendingRemove) {
              return;
            }
            const id = pendingRemove.id;
            setPendingRemove(null);
            void removeStudioCollectionItem(slug, id).then(() => reload());
          }}
        />

        <ConfirmDialog
          isOpen={pendingCoverDelete}
          title="Remove cover image?"
          description={`The ${kindLabel} will fall back to its default placeholder until you upload a new cover.`}
          confirmLabel="Remove cover"
          onCancel={() => setPendingCoverDelete(false)}
          onConfirm={() => {
            setPendingCoverDelete(false);
            void removeCover();
          }}
        />
      </div>
    </StudioGate>
  );
}
