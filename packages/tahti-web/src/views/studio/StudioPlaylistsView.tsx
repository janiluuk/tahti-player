import { Link } from '@tanstack/react-router';
import {
  GlobeIcon,
  ListMusicIcon,
  LockIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Track } from '@nuclearplayer/model';
import {
  Button,
  Dialog,
  EmptyState,
  Input,
  TrackTable,
} from '@nuclearplayer/ui';

import {
  addStudioCollectionItem,
  createStudioCollection,
  fetchEditorSource,
  fetchStudioArchive,
  fetchStudioCollection,
  fetchStudioCollections,
  fetchStudioReleases,
  patchStudioCollection,
  removeStudioCollectionItem,
  reorderStudioCollectionItems,
} from '../../api/studio';
import type {
  StudioArchiveItem,
  StudioCollection,
  StudioRelease,
} from '../../api/studio-types';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';
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
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/playlists" />
        <StudioPageHeader
          title="Playlists"
          subtitle="Organize archive tracks and releases. Drag to reorder in the editor."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon size={16} aria-hidden className="mr-1.5" />
              New
            </Button>
          }
        />

        {msg && <p className="text-foreground-secondary px-1 text-sm">{msg}</p>}

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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    if (!e.target.checked) {
                      setCollaborative(false);
                    }
                  }}
                />
                Public on profile
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collaborative}
                  disabled={!isPublic}
                  onChange={(e) => setCollaborative(e.target.checked)}
                />
                Others can add tracks
              </label>
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
            <p className="text-foreground-secondary text-sm">Loading…</p>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<ListMusicIcon size={40} className="opacity-40" />}
              title="No playlists yet"
              description="Create a playlist to organize tracks and releases."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  New playlist
                </Button>
              }
            />
          ) : (
            <ul className="divide-border divide-y">
              {rows.map((c) => (
                <li
                  key={c.slug}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="border-border bg-background flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border shadow-sm">
                    {c.coverUrl ? (
                      <img
                        src={c.coverUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ListMusicIcon size={20} className="opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
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
                  <Link to="/studio/playlists/$slug" params={{ slug: c.slug }}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </StudioPanel>
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
  const [archive, setArchive] = useState<StudioArchiveItem[]>([]);
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
  const isDjSet = col?.style === 'DJ_SET_SERIES' || col?.style === 'MIX_SERIES';
  const kindLabel = isDjSet ? 'DJ set' : 'Playlist';

  const reload = () => {
    void Promise.all([
      fetchStudioCollection(slug),
      fetchStudioArchive(),
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
          item.archiveItem?.title ?? item.release?.title ?? item.id,
          item.id,
          item.archiveItem?.durationSec,
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

  const playArchiveItem = async (id: string, title: string) => {
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

  const enqueueArchiveItem = async (id: string, title: string) => {
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
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/collections" />
        <Link
          to="/studio/collections"
          className="text-foreground-secondary text-xs hover:underline"
        >
          ← Collections
        </Link>

        {!col ? (
          <p className="text-foreground-secondary text-sm">Loading…</p>
        ) : (
          <>
            <StudioPageHeader
              title={name || col.name}
              subtitle="Drag tracks to reorder. Add from Library or Releases."
              action={
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => void saveMeta()}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              }
            />

            <StudioPanel title="Visibility">
              <div className="flex flex-col gap-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => {
                      setIsPublic(e.target.checked);
                      if (!e.target.checked) {
                        setCollaborative(false);
                      }
                    }}
                  />
                  Public on profile
                </label>
                {!isDjSet ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={collaborative}
                      disabled={!isPublic}
                      onChange={(e) => setCollaborative(e.target.checked)}
                    />
                    Others can add tracks (collaborative)
                  </label>
                ) : null}
              </div>
            </StudioPanel>

            <StudioPanel
              title="Tracks"
              description={`${items.length} item${items.length === 1 ? '' : 's'}`}
            >
              {tracks.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  Empty {kindLabel.toLowerCase()} — add archive tracks or whole
                  releases below.
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
                      displayPosition: true,
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
                        if (item?.archiveItem) {
                          const playableId = `archive:${item.archiveItem.id}`;
                          if (currentId === playableId) {
                            setPlayerStatus(
                              playerStatus === 'playing' ||
                                playerStatus === 'loading'
                                ? 'paused'
                                : 'playing',
                            );
                          } else {
                            void playArchiveItem(item.archiveItem.id, t.title);
                          }
                        }
                      },
                      onAddToQueue: (t) => {
                        const item = items.find((i) => i.id === t.source.id);
                        if (item?.archiveItem) {
                          void enqueueArchiveItem(item.archiveItem.id, t.title);
                        }
                      },
                    }}
                    meta={{
                      isCurrentTrack: (track) => {
                        const item = items.find(
                          (candidate) => candidate.id === track.source.id,
                        );
                        return Boolean(
                          item?.archiveItem &&
                          currentId === `archive:${item.archiveItem.id}`,
                        );
                      },
                      isTrackPlaying: (track) => {
                        const item = items.find(
                          (candidate) => candidate.id === track.source.id,
                        );
                        return Boolean(
                          item?.archiveItem &&
                          currentId === `archive:${item.archiveItem.id}` &&
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
                            (item?.archiveItem &&
                              queueItem.id === `archive:${item.archiveItem.id}`)
                          );
                        }),
                    }}
                  />
                </div>
              )}

              <div className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-foreground-secondary text-xs uppercase">
                    Add from Library
                  </label>
                  <select
                    value={addArchiveId}
                    onChange={(e) => setAddArchiveId(e.target.value)}
                    className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Select track…</option>
                    {archive.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!addArchiveId}
                    onClick={() => {
                      void addStudioCollectionItem(slug, {
                        archiveItemId: addArchiveId,
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
                  <label className="text-foreground-secondary text-xs uppercase">
                    Add release
                  </label>
                  <select
                    value={addReleaseId}
                    onChange={(e) => setAddReleaseId(e.target.value)}
                    className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Select release…</option>
                    {releases.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
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
      </div>
    </StudioGate>
  );
}
