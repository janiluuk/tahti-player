import { useNavigate } from '@tanstack/react-router';
import { CheckSquareIcon, FolderDownIcon, SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Input,
  PluginStoreItem,
  TabLabel,
  Tabs,
} from '@tahti-player/ui';

import { installMeIntegration } from '../../../api/integrations';
import {
  fetchHearthisArtistTracks,
  hearthisProfileFromQuery,
  type HearthisLibrary,
  type HearthisTrack,
} from '../../../api/sources';
import {
  createStudioCollection,
  deleteStudioCollection,
  fetchStudioCollections,
  patchStudioCollection,
} from '../../../api/studio';
import { fetchMeProfile, patchMeProfile } from '../../../api/studio-extras';
import type { StudioCollection } from '../../../api/studio-types';
import { toastWithUndo } from '../../../lib/undoToast';
import { hearthisSourceAdapter } from '../../../plugins/import-sources';
import { useAuthStore } from '../../../stores/authStore';
import { usePluginInstallStore } from '../../../stores/pluginInstallStore';
import { PageEmpty, PageError } from '../../PageStates';
import { SourceServiceIcon } from '../../SourceServiceIcon';
import type { ServicePlugin } from '../serviceCatalog';
import { ConfigurableCard } from '../shared';
import {
  HearthisCollectionList,
  type HearthisCollection,
} from './HearthisCollectionList';
import { HearthisConnectForm } from './HearthisConnectForm';
import {
  HearthisImportDestination,
  NEW_PLAYLIST_DESTINATION,
} from './HearthisImportDestination';
import {
  collectionImportMessage,
  playlistImportMessage,
} from './hearthisImportMessages';
import { readImportedIds, writeImportedIds } from './hearthisImports';
import { HearthisTrackList } from './HearthisTrackList';

const LIBRARY_TABS = ['tracks', 'sets', 'collections', 'search'] as const;

export function HearthisCard({ plugin }: { plugin: ServicePlugin }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [handle, setHandle] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [library, setLibrary] = useState<HearthisLibrary | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryLoadError, setLibraryLoadError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<(typeof LIBRARY_TABS)[number]>('tracks');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<HearthisTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [destinationCollections, setDestinationCollections] = useState<
    StudioCollection[]
  >([]);
  const [destinationId, setDestinationId] = useState('');
  const [newDestinationName, setNewDestinationName] = useState('');
  const [importCoverArt, setImportCoverArt] = useState(true);

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
    setLibraryLoadError(null);
    Promise.all([hearthisSourceAdapter.library(), fetchStudioCollections()])
      .then(([libraryResult, collectionResult]) => {
        if (request !== libraryRequest.current) {
          return;
        }
        setLibrary(libraryResult.data);
        setLibraryLoadError(
          libraryResult.meta.source === 'api'
            ? (libraryResult.meta.reason ?? null)
            : null,
        );
        setDestinationCollections(collectionResult.data);
        setDestinationId(
          (current) =>
            current || (collectionResult.data.find((c) => c.id)?.id ?? ''),
        );
      })
      .catch(() => {
        if (request === libraryRequest.current) {
          setLibraryLoadError(t('hearthisCardStates.libraryLoadFailed'));
          toast.error(i18n.t('web:toasts.hearthisLibraryLoadFailed'));
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
    if (user) {
      setImportedIds(readImportedIds(user.id));
    }
  }, [user]);

  const saveHandle = async (value: string): Promise<boolean> => {
    setMsg(null);
    try {
      const profile = await fetchMeProfile();
      const r = await patchMeProfile({
        socialLinks: { ...(profile.data.socialLinks ?? {}), hearthisAt: value },
      });
      if (!r.ok) {
        setMsg(r.error);
        toast.error(r.error);
        return false;
      }
      setHandle(value);
      setMsg(t('hearthisCardStates.saved'));
      toast.success(i18n.t('web:toasts.hearthisUsernameSaved'));
      loadLibrary();
      return true;
    } catch {
      toast.error(i18n.t('web:toasts.hearthisUsernameSaveFailed'));
      return false;
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
  const showLibraryError =
    !libraryBusy &&
    tab !== 'search' &&
    libraryLoadError !== null &&
    (library?.tracks.length ?? 0) +
      (library?.sets.length ?? 0) +
      (library?.collections.length ?? 0) ===
      0;
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
      setMsg(t('hearthisCardStates.namePlaylistFirst'));
      return null;
    }
    const created = await createStudioCollection({
      name,
      style: 'PLAYLIST',
      isPublic: false,
    });
    if (!created.ok || !created.data.id) {
      setMsg(
        created.ok ? t('hearthisCardStates.playlistNoImportId') : created.error,
      );
      return null;
    }
    setDestinationCollections((current) => [created.data, ...current]);
    setDestinationId(created.data.id);
    setNewDestinationName('');
    const createdId = created.data.id;
    toastWithUndo(
      t('hearthisCardBatch34.createdPlaylist', { name: created.data.name }),
      {
        undo: () => deleteStudioCollection(created.data.slug),
        undoneMessage: t('hearthisCardBatch34.removedPlaylist', {
          name: created.data.name,
        }),
        onUndone: () => {
          setDestinationCollections((current) =>
            current.filter((collection) => collection.id !== createdId),
          );
          setDestinationId((current) => (current === createdId ? '' : current));
        },
      },
    );
    return createdId;
  };

  const importedRef = useRef(importedIds);
  importedRef.current = importedIds;
  const markImported = (trackIds: string[]) => {
    const next = new Set(importedRef.current);
    trackIds.forEach((id) => next.add(id));
    importedRef.current = next;
    setImportedIds(next);
    if (user) {
      writeImportedIds(user.id, next);
    }
  };

  const importTracksToDestination = async (tracks: HearthisTrack[]) => {
    const resolvedDestinationId = await resolveDestinationId();
    if (!resolvedDestinationId) {
      setMsg(
        (current) => current ?? t('hearthisCardStates.choosePlaylistFirst'),
      );
      return;
    }
    const pendingTracks = tracks.filter(
      (track) => !importedRef.current.has(track.id),
    );
    if (pendingTracks.length === 0) {
      setMsg(t('hearthisCardStates.alreadyImportedOnce'));
      toast.info(i18n.t('web:toasts.hearthisTracksAlreadyInLibrary'));
      return;
    }
    setBusy(true);
    const notificationId = toast.loading(
      t('hearthisCardBatch34.importStarted', { count: pendingTracks.length }),
    );
    try {
      const result = await hearthisSourceAdapter.importTracks(
        resolvedDestinationId,
        pendingTracks,
        { importCoverArt },
      );
      setSelected(new Set());
      markImported(result.items.map((item) => item.trackId));
      const completionMessage = playlistImportMessage(t, result);
      setMsg(completionMessage);
      const firstItem = result.items[0];
      if (firstItem) {
        toast.success(completionMessage, {
          id: notificationId,
          action: {
            label:
              result.items.length === 1
                ? t('hearthisCardStates.openTrack')
                : t('hearthisCardStates.openFirstTrack'),
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
        error instanceof Error
          ? error.message
          : t('hearthisCardBatch34.importFailed');
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
      setMsg(t('hearthisCardStates.alreadyImportedCollection'));
      toast.info(i18n.t('web:toasts.hearthisItemsAlreadyInLibrary'));
      return;
    }
    const notificationId = toast.loading(
      t('hearthisCardBatch34.importStartedNamed', { name }),
    );
    try {
      const created = await createStudioCollection({
        name,
        description,
        style: 'PLAYLIST',
        isPublic: true,
      });
      if (!created.ok || !created.data.id) {
        setMsg(
          created.ok
            ? t('hearthisCardStates.collectionNoImportId')
            : created.error,
        );
        toast.error(i18n.t('web:toasts.couldNotCreateDestinationCollection'), {
          id: notificationId,
        });
        return;
      }
      const result = await hearthisSourceAdapter.importTracks(
        created.data.id,
        pendingTracks,
        { importCoverArt },
      );
      markImported(result.items.map((item) => item.trackId));
      if (coverUrl) {
        await patchStudioCollection(created.data.slug, { coverUrl }).catch(
          () => undefined,
        );
      }
      const completionMessage = collectionImportMessage(t, name, result);
      setMsg(completionMessage);
      toast.success(completionMessage, {
        id: notificationId,
        action: {
          label: t('hearthisCard.openCollection'),
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
        error instanceof Error
          ? error.message
          : t('hearthisCardStates.collectionImportFailed');
      setMsg(text);
      toast.error(text, { id: notificationId });
    }
  };

  const importCollection = async (collection: HearthisCollection) => {
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
        error instanceof Error
          ? error.message
          : t('hearthisCardStates.collectionImportFailed'),
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
          labels={{
            install: t('hearthisCardStates.configure'),
            installed: t('hearthisCardStates.configured'),
          }}
        />
      )}
    >
      <HearthisConnectForm handle={handle} onSave={saveHandle} />
      {msg && (
        <p className="text-foreground-secondary text-xs" role="status">
          {msg}
        </p>
      )}

      {handle && (
        <>
          <Tabs.Root
            selectedIndex={Math.max(0, LIBRARY_TABS.indexOf(tab))}
            onChange={(index) => {
              const next = LIBRARY_TABS[index];
              if (!next) {
                return;
              }
              setTab(next);
              setSelected(new Set());
            }}
          >
            <Tabs.List
              aria-label={t('hearthisCardStates.library')}
              className="flex-wrap"
            >
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.tracks.length ?? 0}
                >
                  {t('hearthisCardStates.tracks')}
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.sets.length ?? 0}
                >
                  {t('hearthisCardStates.djSets')}
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<FolderDownIcon size={14} />}
                  count={library?.collections.length ?? 0}
                >
                  {t('hearthisCardStates.collections')}
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel icon={<SearchIcon size={14} />} count={hits.length}>
                  {t('hearthisCardStates.search')}
                </TabLabel>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          {tab === 'search' && (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setSearching(true);
                const profile = hearthisProfileFromQuery(q);
                (profile
                  ? fetchHearthisArtistTracks(profile)
                  : hearthisSourceAdapter.search(q.trim())
                )
                  .then((result) => setHits(result.data))
                  .catch(() =>
                    toast.error(i18n.t('web:toasts.hearthisSearchFailed')),
                  )
                  .finally(() => setSearching(false));
              }}
            >
              <Input
                enterKeyHint="search"
                aria-label={t('hearthisCardStates.searchHearthis')}
                type="search"
                autoCorrect="off"
                spellCheck={false}
                className="min-w-0 flex-1 basis-40"
                size="sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('hearthisCardStates.searchPlaceholder')}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!q.trim() || searching}
                type="submit"
              >
                <SearchIcon size={16} aria-hidden className="mr-1.5" />
                {searching
                  ? t('hearthisCardStates.searching')
                  : t('hearthisCardStates.search')}
              </Button>
            </form>
          )}

          {tab !== 'collections' && (
            <HearthisImportDestination
              playlistDestinations={playlistDestinations}
              destinationId={destinationId}
              onDestinationIdChange={setDestinationId}
              newDestinationName={newDestinationName}
              onNewDestinationNameChange={setNewDestinationName}
              visibleTrackCount={visibleTracks.length}
              selectedCount={selected.size}
              busy={busy}
              importCoverArt={importCoverArt}
              onImportCoverArtChange={setImportCoverArt}
              onSelectAll={() =>
                setSelected(
                  new Set(
                    visibleTracks
                      .filter((track) => !importedIds.has(track.id))
                      .map((track) => track.id),
                  ),
                )
              }
              onImport={() => void importSelection()}
            />
          )}

          {showLibraryError ? (
            <PageError
              title={t('loadErrors.couldNotLoadYourHearthisAt')}
              description={libraryLoadError ?? undefined}
              onRetry={loadLibrary}
            />
          ) : tab === 'collections' ? (
            <HearthisCollectionList
              collections={library?.collections ?? []}
              selected={selected}
              busy={busy}
              onToggle={toggleSelected}
              onImportCollection={(collection) =>
                void importCollection(collection)
              }
              onSelectAll={() =>
                setSelected(new Set(library?.collections.map((c) => c.id)))
              }
              onImportSelected={() => void importSelection()}
            />
          ) : (
            <HearthisTrackList
              tracks={visibleTracks}
              selected={selected}
              importedIds={importedIds}
              importDisabled={
                busy ||
                !destinationId ||
                (destinationId === NEW_PLAYLIST_DESTINATION &&
                  !newDestinationName.trim())
              }
              onToggle={toggleSelected}
              onImport={(track) => void importTracksToDestination([track])}
            />
          )}
          {!libraryBusy &&
            !showLibraryError &&
            tab !== 'search' &&
            tab !== 'collections' &&
            visibleTracks.length === 0 && (
              <PageEmpty
                title={
                  tab === 'sets'
                    ? t('hearthisCardBatch34.noSetsFound')
                    : t('hearthisCardBatch34.noTracksFound')
                }
              />
            )}
        </>
      )}
      <p className="text-foreground-secondary text-xs">
        {t('hearthisCardBatch34.premiumNote')}
      </p>
    </ConfigurableCard>
  );
}
