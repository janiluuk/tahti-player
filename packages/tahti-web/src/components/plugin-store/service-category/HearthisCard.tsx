import { useNavigate } from '@tanstack/react-router';
import {
  CheckSquareIcon,
  DownloadIcon,
  FolderDownIcon,
  ListPlus,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  MediaArtwork,
  PluginStoreItem,
  Select,
  TabLabel,
  Tabs,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import { installMeIntegration } from '../../../api/integrations';
import {
  playableFromHearthis,
  type HearthisLibrary,
  type HearthisTrack,
} from '../../../api/sources';
import {
  createStudioCollection,
  fetchStudioCollections,
  patchStudioCollection,
} from '../../../api/studio';
import { fetchMeProfile, patchMeProfile } from '../../../api/studio-extras';
import type { StudioCollection } from '../../../api/studio-types';
import { hearthisSourceAdapter } from '../../../plugins/import-sources';
import { useAuthStore } from '../../../stores/authStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { usePluginInstallStore } from '../../../stores/pluginInstallStore';
import { SourceServiceIcon } from '../../SourceServiceIcon';
import type { ServicePlugin } from '../serviceCatalog';
import { ConfigurableCard } from '../shared';

const HEARTHIS_IMPORTS_STORAGE_KEY = 'tahti-web-hearthis-imports';
const NEW_PLAYLIST_DESTINATION = '__new_playlist__';

export function HearthisCard({ plugin }: { plugin: ServicePlugin }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  const [handle, setHandle] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [library, setLibrary] = useState<HearthisLibrary | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'tracks' | 'sets' | 'collections' | 'search'>(
    'tracks',
  );
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<HearthisTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [destinationCollections, setDestinationCollections] = useState<
    StudioCollection[]
  >([]);
  const [destinationId, setDestinationId] = useState('');
  const [newDestinationName, setNewDestinationName] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchMeProfile()
      .then((r) => {
        if (!cancelled) {
          setHandle(r.data.socialLinks?.hearthisAt ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    usePluginInstallStore.getState().setInstalled(plugin.id, Boolean(handle));
    // The frontend has always treated "has a saved hearthis.at handle" as
    // "plugin installed", but /api/v1/imports/hearthis/add requires an
    // actual hearthis-import IntegrationCredential row — nothing ever
    // created one, so every import (any playlist, any track) 400'd with
    // "Install the hearthis.at import plugin first". hearthis-import has
    // no real fields (public API, no key needed — see
    // packages/shared/src/integration-providers.ts), so this is just an
    // idempotent upsert to bring the backend row in line with what the UI
    // already implied was true. Also covers accounts that saved their
    // handle before this fix shipped.
    if (handle) {
      installMeIntegration('hearthis-import', {}).catch(() => undefined);
    }
  }, [plugin.id, handle]);

  const libraryRequest = useRef(0);
  const loadLibrary = () => {
    if (!user) {
      return;
    }
    const request = ++libraryRequest.current;
    setLibraryBusy(true);
    Promise.all([hearthisSourceAdapter.library(), fetchStudioCollections()])
      .then(([libraryResult, collectionResult]) => {
        if (request !== libraryRequest.current) {
          return;
        }
        setLibrary(libraryResult.data);
        setDestinationCollections(collectionResult.data);
        setDestinationId(
          (current) =>
            current || (collectionResult.data.find((c) => c.id)?.id ?? ''),
        );
      })
      .catch(() => {
        if (request === libraryRequest.current) {
          toast.error('Could not load your hearthis.at library.');
        }
      })
      .finally(() => {
        if (request === libraryRequest.current) {
          setLibraryBusy(false);
        }
      });
  };

  useEffect(() => {
    loadLibrary();
    return () => {
      libraryRequest.current++;
    };
  }, [user]);

  useEffect(() => {
    if (!user || typeof localStorage === 'undefined') {
      return;
    }
    try {
      const stored = JSON.parse(
        localStorage.getItem(`${HEARTHIS_IMPORTS_STORAGE_KEY}:${user.id}`) ??
          '[]',
      ) as unknown;
      setImportedIds(
        new Set(
          Array.isArray(stored)
            ? stored.filter((id): id is string => typeof id === 'string')
            : [],
        ),
      );
    } catch {
      setImportedIds(new Set());
    }
  }, [user]);

  const save = async () => {
    const value = draft.trim().replace(/^@/, '');
    if (!value) {
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const profile = await fetchMeProfile();
      const r = await patchMeProfile({
        socialLinks: { ...(profile.data.socialLinks ?? {}), hearthisAt: value },
      });
      if (!r.ok) {
        setMsg(r.error);
        toast.error(r.error);
        return;
      }
      setHandle(value);
      setDraft('');
      setMsg('Saved.');
      toast.success('hearthis.at username saved.');
      loadLibrary();
    } catch {
      toast.error('Could not save the hearthis.at username.');
    } finally {
      setSaving(false);
    }
  };

  const visibleTracks =
    tab === 'tracks'
      ? (library?.tracks ?? [])
      : tab === 'sets'
        ? (library?.sets ?? [])
        : tab === 'search'
          ? hits
          : [];
  const playlistDestinations = destinationCollections.filter(
    (c) => !c.style || c.style === 'PLAYLIST',
  );

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resolveDestinationId = async (): Promise<string | null> => {
    if (destinationId !== NEW_PLAYLIST_DESTINATION) {
      return destinationId || null;
    }
    const name = newDestinationName.trim();
    if (!name) {
      setMsg('Give the new playlist a name first.');
      return null;
    }
    const created = await createStudioCollection({
      name,
      style: 'PLAYLIST',
      isPublic: false,
    });
    if (!created.ok || !created.data.id) {
      setMsg(created.ok ? 'Created playlist has no import ID.' : created.error);
      return null;
    }
    setDestinationCollections((current) => [created.data, ...current]);
    setDestinationId(created.data.id);
    setNewDestinationName('');
    toast.success(`Created playlist “${created.data.name}”.`);
    return created.data.id;
  };

  // Kept in a ref as well as state: several imports can finish in a row
  // (multi-collection import), and each must add to the ids the previous one
  // recorded rather than to the render's stale snapshot.
  const importedRef = useRef(importedIds);
  importedRef.current = importedIds;
  const markImported = (trackIds: string[]) => {
    const next = new Set(importedRef.current);
    trackIds.forEach((id) => next.add(id));
    importedRef.current = next;
    setImportedIds(next);
    if (user && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `${HEARTHIS_IMPORTS_STORAGE_KEY}:${user.id}`,
          JSON.stringify([...next]),
        );
      } catch {
        // Storage full/blocked: the imported marks just won't survive a reload.
      }
    }
  };

  const importTracksToDestination = async (tracks: HearthisTrack[]) => {
    const resolvedDestinationId = await resolveDestinationId();
    if (!resolvedDestinationId) {
      setMsg((current) => current ?? 'Choose or create a playlist first.');
      return;
    }
    const pendingTracks = tracks.filter(
      (track) => !importedRef.current.has(track.id),
    );
    if (pendingTracks.length === 0) {
      setMsg(
        'Already imported — each hearthis.at item can only be imported once.',
      );
      toast.info('These hearthis.at tracks are already in your library.');
      return;
    }
    setBusy(true);
    const notificationId = toast.loading(
      `Import started for ${pendingTracks.length} item${pendingTracks.length === 1 ? '' : 's'}…`,
    );
    try {
      const result = await hearthisSourceAdapter.importTracks(
        resolvedDestinationId,
        pendingTracks,
      );
      setSelected(new Set());
      markImported(result.items.map((item) => item.trackId));
      const completionMessage =
        result.failed > 0
          ? `Imported ${result.imported}; ${result.failed} could not be imported.`
          : result.artworkFailed > 0
            ? `Imported ${result.imported} item${result.imported === 1 ? '' : 's'}; ${result.artworkFailed} cover${result.artworkFailed === 1 ? '' : 's'} could not be stored.`
            : `Import completed — ${result.imported} item${result.imported === 1 ? '' : 's'} added to the playlist.`;
      setMsg(completionMessage);
      const firstItem = result.items[0];
      if (firstItem) {
        toast.success(completionMessage, {
          id: notificationId,
          action: {
            label:
              result.items.length === 1 ? 'Open track' : 'Open first track',
            onClick: () =>
              void navigate({
                to: '/studio/sounds/$id',
                params: { id: firstItem.soundId },
              }),
          },
        });
      } else {
        toast.error(completionMessage, { id: notificationId });
      }
    } catch (error) {
      const text =
        error instanceof Error ? error.message : 'hearthis.at import failed.';
      setMsg(text);
      toast.error(text, { id: notificationId });
    } finally {
      setBusy(false);
    }
  };

  const importTracksAsCollection = async (
    name: string,
    description: string,
    tracks: HearthisTrack[],
    coverUrl?: string | null,
  ) => {
    const pendingTracks = tracks.filter(
      (track) => !importedRef.current.has(track.id),
    );
    if (pendingTracks.length === 0) {
      setMsg('Already imported — no duplicate collection was created.');
      toast.info('These hearthis.at items are already in your library.');
      return;
    }
    const notificationId = toast.loading(`Import started for “${name}”…`);
    try {
      const created = await createStudioCollection({
        name,
        description,
        style: 'PLAYLIST',
        isPublic: true,
      });
      if (!created.ok || !created.data.id) {
        setMsg(
          created.ok ? 'Created collection has no import ID.' : created.error,
        );
        toast.error('Could not create the destination collection.', {
          id: notificationId,
        });
        return;
      }
      const result = await hearthisSourceAdapter.importTracks(
        created.data.id,
        pendingTracks,
      );
      markImported(result.items.map((item) => item.trackId));
      if (coverUrl) {
        // A cover failure shouldn't hide that the tracks did import.
        await patchStudioCollection(created.data.slug, { coverUrl }).catch(
          () => undefined,
        );
      }
      const completionMessage =
        result.failed > 0
          ? `Created “${name}” with ${result.imported} items; ${result.failed} failed.`
          : result.artworkFailed > 0
            ? `Created “${name}” with ${result.imported} items; ${result.artworkFailed} cover${result.artworkFailed === 1 ? '' : 's'} could not be stored.`
            : `Import completed — created “${name}” with ${result.imported} item${result.imported === 1 ? '' : 's'}.`;
      setMsg(completionMessage);
      toast.success(completionMessage, {
        id: notificationId,
        action: {
          label: 'Open collection',
          onClick: () =>
            void navigate({
              to: '/studio/collections/$slug',
              params: { slug: created.data.slug },
            }),
        },
      });
      const collectionsResult = await fetchStudioCollections();
      setDestinationCollections(collectionsResult.data);
    } catch (error) {
      const text =
        error instanceof Error ? error.message : 'Collection import failed.';
      setMsg(text);
      toast.error(text, { id: notificationId });
    }
  };

  const importCollection = async (
    collection: NonNullable<HearthisLibrary>['collections'][number],
  ) => {
    setBusy(true);
    try {
      const tracks = await hearthisSourceAdapter.collectionTracks(
        collection.permalink,
      );
      await importTracksAsCollection(
        collection.title,
        collection.description,
        tracks,
        collection.coverUrl,
      );
    } catch (error) {
      setMsg(
        error instanceof Error ? error.message : 'Collection import failed.',
      );
    } finally {
      setBusy(false);
    }
  };

  const importSelection = async () => {
    if (tab === 'collections') {
      const collections = (library?.collections ?? []).filter((c) =>
        selected.has(c.id),
      );
      for (const collection of collections) {
        await importCollection(collection);
      }
      setSelected(new Set());
      return;
    }
    const tracks = visibleTracks.filter((track) => selected.has(track.id));
    await importTracksToDestination(tracks);
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      dialogClassName="max-w-3xl"
      header={(open) => (
        <PluginStoreItem
          icon={<SourceServiceIcon id="hearthis" />}
          name={plugin.name}
          author={plugin.author}
          description={plugin.description}
          isInstalled={Boolean(handle)}
          onInstall={open}
          labels={{ install: 'Configure', installed: 'Configured' }}
        />
      )}
    >
      <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
        {handle ? (
          <span className="text-sm">
            Connected as <span className="font-medium">@{handle}</span>
          </span>
        ) : (
          <span className="text-foreground-secondary text-sm">
            Add your hearthis.at username to load your library.
          </span>
        )}
        <Input
          className="min-w-0 flex-1 basis-40"
          size="sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={handle ? 'Change username…' : 'hearthis.at username'}
          aria-label="hearthis.at username"
        />
        <Button
          size="sm"
          disabled={saving || !draft.trim()}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : handle ? 'Update' : 'Connect'}
        </Button>
      </div>
      {msg && (
        <p className="text-foreground-secondary text-xs" role="status">
          {msg}
        </p>
      )}

      {handle && (
        <>
          <Tabs.Root
            selectedIndex={Math.max(
              0,
              (['tracks', 'sets', 'collections', 'search'] as const).indexOf(
                tab,
              ),
            )}
            onChange={(index) => {
              const next = (
                ['tracks', 'sets', 'collections', 'search'] as const
              )[index];
              if (!next) {
                return;
              }
              setTab(next);
              setSelected(new Set());
            }}
          >
            <Tabs.List aria-label="hearthis.at library" className="flex-wrap">
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.tracks.length ?? 0}
                >
                  Tracks
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.sets.length ?? 0}
                >
                  DJ sets
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<FolderDownIcon size={14} />}
                  count={library?.collections.length ?? 0}
                >
                  Collections
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel icon={<SearchIcon size={14} />} count={hits.length}>
                  Search
                </TabLabel>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          {tab === 'search' && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="min-w-0 flex-1 basis-40"
                size="sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search hearthis.at"
              />
              <Button
                size="sm"
                disabled={!q.trim() || searching}
                onClick={() => {
                  setSearching(true);
                  hearthisSourceAdapter
                    .search(q.trim())
                    .then((result) => setHits(result.data))
                    .catch(() => toast.error('hearthis.at search failed.'))
                    .finally(() => setSearching(false));
                }}
              >
                <SearchIcon size={16} aria-hidden className="mr-1.5" />
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </div>
          )}

          {tab !== 'collections' && (
            <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <Select
                className="min-w-0 flex-1 basis-40"
                options={[
                  { id: '', label: 'Choose destination playlist' },
                  { id: NEW_PLAYLIST_DESTINATION, label: 'New playlist…' },
                  ...playlistDestinations.map((c) => ({
                    id: c.id ?? c.slug,
                    label: c.name,
                  })),
                ]}
                value={destinationId}
                onValueChange={setDestinationId}
              />
              {destinationId === NEW_PLAYLIST_DESTINATION ? (
                <Input
                  size="sm"
                  value={newDestinationName}
                  onChange={(e) => setNewDestinationName(e.target.value)}
                  aria-label="New playlist name"
                  placeholder="Playlist name"
                  className="min-w-0 flex-1 basis-40"
                />
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                disabled={visibleTracks.length === 0}
                onClick={() =>
                  setSelected(
                    new Set(
                      visibleTracks
                        .filter((track) => !importedIds.has(track.id))
                        .map((track) => track.id),
                    ),
                  )
                }
              >
                <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
                Select all
              </Button>
              <Button
                size="sm"
                disabled={
                  busy ||
                  !destinationId ||
                  (destinationId === NEW_PLAYLIST_DESTINATION &&
                    !newDestinationName.trim()) ||
                  selected.size === 0
                }
                onClick={() => void importSelection()}
              >
                <DownloadIcon size={15} className="mr-1.5" aria-hidden />
                Import selected ({selected.size})
              </Button>
            </div>
          )}

          {tab === 'collections' ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {(library?.collections ?? []).map((collection) => (
                <li
                  key={collection.id}
                  className="border-border flex items-center gap-3 rounded-lg border p-3"
                >
                  <Toggle
                    label={`Select ${collection.title}`}
                    checked={selected.has(collection.id)}
                    onChange={() => toggleSelected(collection.id)}
                  />
                  <MediaArtwork
                    size="thumb"
                    src={collection.coverUrl}
                    alt={collection.title}
                    imageReveal={false}
                    className="border-border shrink-0 rounded border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {collection.title}
                    </p>
                    <p className="text-foreground-secondary text-xs">
                      {collection.trackCount} items
                    </p>
                  </div>
                  <Tooltip content="Import as collection" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void importCollection(collection)}
                      aria-label={`Import ${collection.title} as collection`}
                    >
                      <FolderDownIcon size={15} />
                    </Button>
                  </Tooltip>
                </li>
              ))}
              {(library?.collections.length ?? 0) > 0 && (
                <li className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setSelected(
                        new Set(library?.collections.map((c) => c.id)),
                      )
                    }
                  >
                    <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
                    Select all
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || selected.size === 0}
                    onClick={() => void importSelection()}
                  >
                    <FolderDownIcon size={15} className="mr-1.5" aria-hidden />
                    Import selected ({selected.size})
                  </Button>
                </li>
              )}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleTracks.map((track) => (
                <li
                  key={track.id}
                  className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <Toggle
                    label={`Select ${track.title}`}
                    checked={selected.has(track.id)}
                    disabled={importedIds.has(track.id)}
                    onChange={() => toggleSelected(track.id)}
                  />
                  <MediaArtwork
                    size="thumb"
                    src={track.coverUrl}
                    alt={track.title}
                    imageReveal={false}
                    onPlay={() => play(playableFromHearthis(track))}
                    playLabel="Preview"
                    className="border-border shrink-0 rounded border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {track.title}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {track.username}
                    </div>
                  </div>
                  <Tooltip content="Queue" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      aria-label={`Queue ${track.title}`}
                      onClick={() => enqueue(playableFromHearthis(track))}
                    >
                      <ListPlus size={15} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy ||
                      !destinationId ||
                      (destinationId === NEW_PLAYLIST_DESTINATION &&
                        !newDestinationName.trim()) ||
                      importedIds.has(track.id)
                    }
                    onClick={() => void importTracksToDestination([track])}
                  >
                    <DownloadIcon size={15} className="mr-1.5" aria-hidden />
                    {importedIds.has(track.id) ? 'Imported' : 'Import'}
                  </Button>
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-secondary shrink-0 text-xs underline-offset-2 hover:underline"
                  >
                    hearthis.at ↗
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!libraryBusy &&
            tab !== 'search' &&
            tab !== 'collections' &&
            visibleTracks.length === 0 && (
              <p className="text-foreground-secondary text-sm">
                No {tab} found for this profile.
              </p>
            )}
        </>
      )}

      <p className="text-foreground-secondary text-xs">
        A hearthis.at Premium account is required to export your own tracks
        there — importing from hearthis.at works on any account.
      </p>
    </ConfigurableCard>
  );
}
