import { Link } from '@tanstack/react-router';
import {
  GlobeIcon,
  ListMusicIcon,
  LockIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Track } from '@tahti-player/model';
import {
  Button,
  Dialog,
  EmptyState,
  Input,
  MediaArtwork,
  SaveButton,
  Select,
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
} from '../../api/studio';
import type {
  StudioCollection,
  StudioRelease,
  StudioSound,
} from '../../api/studio-types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { normalizeCollectionStyle } from '../../content/collectionStyles';
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
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/playlists" />
        <ViewShell
          title="Playlists"
          subtitle="Archive tracks and releases."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4">
            <Tooltip content="New playlist" side="top">
              <Button
                size="icon-sm"
                onClick={() => setCreateOpen(true)}
                aria-label="New playlist"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>

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

function itemToTrack(
  title: string,
  id: string,
  durationSec?: number | null,
): Track {
  return {
    title,
    artists: [{ name: 'You', roles: ['performer'] }],
    durationMs:
      durationSec != null ? Math.round(durationSec * 1000) : undefined,
    source: { provider: 'tahti', id },
  };
}

export function StudioPlaylistEditorView({ slug }: { slug: string }) {
  const [col, setCol] = useState<StudioCollection | null>(null);
  const [archive, setArchive] = useState<StudioSound[]>([]);
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [collaborative, setCollaborative] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addArchiveId, setAddArchiveId] = useState('');
  const [addReleaseId, setAddReleaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);
  const isDjSet = normalizeCollectionStyle(col?.style) === 'DJ_SET_SERIES';
  const kindLabel = isDjSet ? 'DJ set' : 'Playlist';

  const reload = () => {
    void Promise.all([
      fetchStudioCollection(slug),
      fetchStudioSounds(),
      fetchStudioReleases(),
    ]).then(([c, a, r]) => {
      setCol(c.data);
      setName(c.data.name);
      setIsPublic(c.data.isPublic !== false);
      setCollaborative(Boolean(c.data.collaborative));
      setArchive(a.data);
      setReleases(r.data.releases);
    });
  };

  useEffect(() => {
    reload();
  }, [slug]);

  const items = col?.items ?? [];
  const tracks: Track[] = useMemo(
    () =>
      items.map((item) =>
        itemToTrack(
          item.sound?.title ?? item.release?.title ?? item.id,
          item.id,
          item.sound?.durationSec,
        ),
      ),
    [items],
  );

  const saveMeta = async () => {
    setSaving(true);
    const r = await patchStudioCollection(slug, {
      name: name.trim() || slug,
      isPublic,
      collaborative: !isDjSet && isPublic && collaborative,
      style: isDjSet ? 'DJ_SET_SERIES' : 'PLAYLIST',
    });
    setSaving(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg(`${kindLabel} settings saved.`);
    reload();
  };

  const playSound = async (id: string, title: string) => {
    const { data } = await fetchEditorSource(id);
    play({
      id: `archive:${id}`,
      kind: 'archive',
      title: data.title || title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const enqueueSound = async (id: string, title: string) => {
    const { data } = await fetchEditorSource(id);
    enqueue({
      id: `archive:${id}`,
      kind: 'archive',
      title: data.title || title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
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
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/collections" />
        <Link
          to="/studio/collections"
          className="text-foreground-secondary text-xs hover:underline"
        >
          ← Collections
        </Link>

        {!col ? (
          <PageLoading label="Loading…" />
        ) : (
          <>
            <ViewShell
              title={name || col.name}
              subtitle="Reorder tracks."
              classes={{ root: 'px-0 pt-0' }}
            >
              <div className="mb-4">
                <SaveButton saving={saving} onClick={() => void saveMeta()} />
              </div>

              <StudioPanel title="Visibility">
                <div className="flex flex-col gap-3">
                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    Empty {kindLabel.toLowerCase()} — add archive tracks or
                    whole releases below.
                  </p>
                ) : (
                  <div className="min-h-[200px]">
                    <TrackTable
                      tracks={tracks}
                      labels={trackTableLabels}
                      getItemId={(_t, index) =>
                        items[index]?.id ?? String(index)
                      }
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
                        onRemove: (_t, index) => {
                          const item = items[index];
                          if (!item) {
                            return;
                          }
                          void removeStudioCollectionItem(slug, item.id).then(
                            () => reload(),
                          );
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
                              void playSound(item.sound.id, t.title);
                            }
                          }
                        },
                        onAddToQueue: (t) => {
                          const item = items.find((i) => i.id === t.source.id);
                          if (item?.sound) {
                            void enqueueSound(item.sound.id, t.title);
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
            </ViewShell>
          </>
        )}
      </div>
    </StudioGate>
  );
}
