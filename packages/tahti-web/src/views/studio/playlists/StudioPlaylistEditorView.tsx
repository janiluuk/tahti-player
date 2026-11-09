import { ListPlusIcon, MusicIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import type { Track } from '@tahti-player/model';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Badge,
  Button,
  Dialog,
  EditIconButton,
  FilePicker,
  Input,
  SaveButton,
  Select,
  Textarea,
  Toggle,
  Tooltip,
  TrackTable,
  type SelectOption,
} from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  fetchEditorSource,
  fetchStudioCollection,
  fetchStudioReleases,
  fetchStudioSounds,
  patchStudioCollection,
  removeStudioCollectionItem,
  reorderStudioCollectionItems,
  uploadCollectionCover,
} from '../../../api/studio';
import type {
  CollectionTrackSortMode,
  StudioCollection,
  StudioRelease,
  StudioSound,
} from '../../../api/studio-types';
import { CatalogTrackSearch } from '../../../components/CatalogTrackSearch';
import { CollectionSortSounds } from '../../../components/CollectionSortSounds';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../../components/EntitySocialHeader';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioCollectionMoreMenu } from '../../../components/StudioCollectionMoreMenu';
import { StudioGate } from '../../../components/StudioGate';
import { StudioPanel } from '../../../components/StudioPanel';
import { normalizeCollectionStyle } from '../../../content/collectionStyles';
import { collectionItemToTrack } from '../../../lib/collectionTrackMapping';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import { trackTableLabels } from '../../../lib/trackTableLabels';
import { toastWithUndo } from '../../../lib/undoToast';
import { useEditMode } from '../../../lib/useEditMode';
import { usePlayerStore } from '../../../stores/playerStore';
import { useStudioContributions } from '../useStudioContributions';

const TRACK_ORDER_OPTIONS: SelectOption[] = [
  { id: 'MANUAL', label: 'Manual (tracklist order)' },
  { id: 'TIME', label: 'Oldest first' },
  { id: 'NAME', label: 'Title (A-Z)' },
];

export function StudioPlaylistEditorView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const [editing, setEditing] = useEditMode();
  const [col, setCol] = useState<StudioCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sounds, setSounds] = useState<StudioSound[]>([]);
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [collaborative, setCollaborative] = useState(false);
  const [trackSortMode, setTrackSortMode] =
    useState<CollectionTrackSortMode>('MANUAL');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addSoundId, setAddSoundId] = useState('');
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
    ])
      .then(([c, a, r]) => {
        if (c.meta.source === 'api' && c.meta.reason) {
          setLoadError(c.meta.reason);
          return;
        }
        setLoadError(null);
        setCol(c.data);
        setName(c.data.name);
        setDescription(c.data.description ?? '');
        setIsPublic(c.data.isPublic !== false);
        setCollaborative(Boolean(c.data.collaborative));
        setTrackSortMode(c.data.trackSortMode ?? 'MANUAL');
        setCoverUrl(c.data.coverUrl ?? null);
        setSounds(a.data);
        setReleases(r.data.releases);
      })
      .catch(() =>
        toast.error(
          t(
            isDjSet
              ? 'toasts.couldNotLoadDjSet'
              : 'toasts.couldNotLoadPlaylist',
          ),
        ),
      );
  };

  useEffect(() => {
    reload();
  }, [slug]);

  // Refresh only the tracklist: a full reload() resets the settings form and
  // drops unsaved edits.
  const refreshItems = async () => {
    try {
      const fresh = await fetchStudioCollection(slug);
      if (fresh.meta.source === 'api' && fresh.meta.reason) {
        toast.error(t('toasts.couldNotRefreshTracklist'));
        return;
      }
      setCol((current) =>
        current ? { ...current, items: fresh.data.items } : fresh.data,
      );
    } catch {
      toast.error(t('toasts.couldNotRefreshTracklist'));
    }
  };

  const items = col?.items ?? [];
  const tracks: Track[] = useMemo(
    () => items.map(collectionItemToTrack),
    [items],
  );
  const contributions = useStudioContributions(items);

  const headerStats: EntitySocialStat[] =
    items.length > 0
      ? [
          {
            key: 'tracks',
            label: t('studioPlaylistEditorView.tracks'),
            value: items.length,
            icon: MusicIcon,
          },
        ]
      : [];

  const addItem = async (
    input: { soundId: string } | { releaseId: string },
    success: string,
    onDone?: () => void,
  ): Promise<boolean> => {
    try {
      const r = await addStudioCollectionItem(slug, input);
      if (!r.ok) {
        toast.error(r.error);
        return false;
      }
      const { itemId } = r;
      if (itemId) {
        toastWithUndo(success, {
          undo: () => removeStudioCollectionItem(slug, itemId),
          undoneMessage: 'Removed again.',
          onUndone: () => void refreshItems(),
        });
      } else {
        toast.success(success);
      }
      onDone?.();
      await refreshItems();
      return true;
    } catch {
      toast.error(t('toasts.couldNotAddItem'));
      return false;
    }
  };

  const saveMeta = async () => {
    setSaving(true);
    try {
      const r = await patchStudioCollection(slug, {
        name: name.trim() || slug,
        description: description.trim() || null,
        isPublic,
        collaborative: !isDjSet && isPublic && collaborative,
        style: isDjSet ? 'DJ_SET_SERIES' : 'PLAYLIST',
        trackSortMode,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setCol((current) =>
        current ? { ...current, ...r.data, items: current.items } : r.data,
      );
      toast.success(
        t(
          isDjSet
            ? 'toasts.djSetSettingsSaved'
            : 'toasts.playlistSettingsSaved',
        ),
      );
    } catch {
      toast.error(t('toasts.couldNotSaveSettings'));
    } finally {
      setSaving(false);
    }
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
    toast.success(t('toasts.coverUploaded'));
  };

  const removeCover = async () => {
    const result = await patchStudioCollection(slug, { coverUrl: null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCoverUrl(null);
    setCol((current) => (current ? { ...current, coverUrl: null } : current));
    toast.success(t('toasts.coverRemoved'));
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
      id: `sound:${sound.id}`,
      kind: 'sound',
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
      id: `sound:${sound.id}`,
      kind: 'sound',
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
    )
      .then((r) => {
        if (!r.ok) {
          toast.error(r.error);
          void refreshItems();
        }
      })
      .catch(() => {
        toast.error(t('toasts.couldNotSaveOrder'));
        void refreshItems();
      });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        <div className="relative flex flex-col gap-6">
          <Tooltip
            content={t('playlistEditor.backToCollections')}
            side="right"
            wrapperClassName={backButtonCornerClassName}
          >
            <BackButtonLink
              to="/studio/collections"
              aria-label={t('playlistEditor.backToCollections')}
            />
          </Tooltip>

          {!col && loadError ? (
            <StudioPanel>
              <PageError
                title={`Could not load this ${kindLabel}`}
                description={loadError}
                onRetry={reload}
              />
            </StudioPanel>
          ) : !col ? (
            <StudioPanel>
              <PageLoading label={t('loading.loading')} />
            </StudioPanel>
          ) : (
            <>
              <EntitySocialHeader
                title={name || col.name}
                imageUrl={coverUrl}
                imageAlt=""
                onImageClick={editing ? () => setUploadOpen(true) : undefined}
                onImageDelete={
                  editing && coverUrl
                    ? () => setPendingCoverDelete(true)
                    : undefined
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
                    {editing ? (
                      <SaveButton
                        saving={saving}
                        onClick={() => void saveMeta()}
                      />
                    ) : null}
                    <EditIconButton
                      label={t('playlistEditor.editDetails')}
                      editing={editing}
                      onClick={() => setEditing(!editing)}
                    />
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
                    {t('playlistEditor.play')}
                  </Button>
                  <StudioCollectionMoreMenu col={col} kindLabel={kindLabel} />
                </div>
              </EntitySocialHeader>

              {editing ? (
                <StudioPanel title={t('playlistEditor.details')}>
                  <div className="flex flex-col gap-3">
                    <Input
                      autoComplete="off"
                      label={t('playlistEditor.name')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Textarea
                      label={t('playlistEditor.description')}
                      tone="secondary"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{t('playlistEditor.publicOnProfile')}</span>
                      <Toggle
                        label={t('playlistEditor.publicOnProfile')}
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
                        <span>
                          {t('playlistEditor.othersCanAddTracksCollaborative')}
                        </span>
                        <Toggle
                          label={t(
                            'playlistEditor.othersCanAddTracksCollaborative',
                          )}
                          checked={collaborative}
                          disabled={!isPublic}
                          onChange={setCollaborative}
                        />
                      </div>
                    ) : null}
                    <Select
                      label={t('playlistEditor.trackOrder')}
                      description={t('playlistEditor.howTracksAreOrderedOn')}
                      value={trackSortMode}
                      onValueChange={(value) =>
                        setTrackSortMode(value as CollectionTrackSortMode)
                      }
                      options={TRACK_ORDER_OPTIONS}
                    />
                  </div>
                </StudioPanel>
              ) : null}

              <StudioPanel
                title={t('playlistEditor.tracks')}
                description={`${items.length} item${items.length === 1 ? '' : 's'}`}
                action={
                  editing && items.length > 1 ? (
                    <CollectionSortSounds
                      slug={slug}
                      items={items}
                      trackSortMode={trackSortMode}
                      onSaved={(next, mode) => {
                        setTrackSortMode(mode);
                        setCol((c) =>
                          c ? { ...c, items: next, trackSortMode: mode } : c,
                        );
                      }}
                    />
                  ) : undefined
                }
              >
                {tracks.length === 0 ? (
                  <PageEmpty
                    title={`This ${kindLabel.toLowerCase()} is empty`}
                    description={
                      editing
                        ? 'Add sound tracks or whole releases below.'
                        : 'Click Edit details to add tracks.'
                    }
                    action={
                      editing ? undefined : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditing(true)}
                        >
                          <ListPlusIcon size={16} aria-hidden />
                          {t('emptyActions.addTracks')}
                        </Button>
                      )
                    }
                  />
                ) : (
                  <div className="min-h-[200px]">
                    <TrackTable
                      tracks={tracks}
                      labels={trackTableLabels}
                      rowHeight={contributions.rowHeight}
                      getItemId={(_t, index) =>
                        items[index]?.id ?? String(index)
                      }
                      features={{
                        header: true,
                        reorderable: editing,
                        filterable: false,
                        sortable: false,
                      }}
                      display={{
                        displayPosition: false,
                        displayArtist: false,
                        displayDuration: true,
                        displayDeleteButton: editing,
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
                          setPendingRemove({
                            id: item.id,
                            title:
                              item.sound?.title ??
                              item.release?.title ??
                              'this item',
                          });
                        },
                        onPlayNow: (t) => {
                          const item = items.find((i) => i.id === t.source.id);
                          if (item?.sound) {
                            const playableId = `sound:${item.sound.id}`;
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
                        getTrackAnnotation: contributions.getTrackAnnotation,
                        isCurrentTrack: (track) => {
                          const item = items.find(
                            (candidate) => candidate.id === track.source.id,
                          );
                          return Boolean(
                            item?.sound &&
                            currentId === `sound:${item.sound.id}`,
                          );
                        },
                        isTrackPlaying: (track) => {
                          const item = items.find(
                            (candidate) => candidate.id === track.source.id,
                          );
                          return Boolean(
                            item?.sound &&
                            currentId === `sound:${item.sound.id}` &&
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
                                queueItem.id === `sound:${item.sound.id}`)
                            );
                          }),
                      }}
                    />
                  </div>
                )}

                {editing ? (
                  <div className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Select
                        label={t('playlistEditor.addFromLibrary')}
                        value={addSoundId}
                        onValueChange={setAddSoundId}
                        options={[
                          {
                            id: '',
                            label: t('studioPlaylistEditorView.selectTrack'),
                          },
                          ...sounds
                            .filter(
                              (a) =>
                                !items.some((item) => item.sound?.id === a.id),
                            )
                            .map((a) => ({ id: a.id, label: a.title })),
                        ]}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!addSoundId}
                        onClick={() => {
                          void addItem(
                            { soundId: addSoundId },
                            'Track added.',
                            () => setAddSoundId(''),
                          );
                        }}
                      >
                        <PlusIcon size={14} aria-hidden className="mr-1.5" />
                        {t('playlistEditor.addTrack')}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        label={t('playlistEditor.addRelease')}
                        value={addReleaseId}
                        onValueChange={setAddReleaseId}
                        options={[
                          {
                            id: '',
                            label: t('studioPlaylistEditorView.selectRelease'),
                          },
                          ...releases.map((r) => ({
                            id: r.id,
                            label: r.title,
                          })),
                        ]}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!addReleaseId}
                        onClick={() => {
                          void addItem(
                            { releaseId: addReleaseId },
                            'Release added.',
                            () => setAddReleaseId(''),
                          );
                        }}
                      >
                        <PlusIcon size={14} aria-hidden className="mr-1.5" />
                        {t('playlistEditor.addRelease')}
                      </Button>
                    </div>
                    <div className="sm:col-span-2">
                      <CatalogTrackSearch
                        label={t('playlistEditor.addAnyPublicTrack')}
                        excludeIds={items.flatMap((item) =>
                          item.sound ? [item.sound.id] : [],
                        )}
                        onAdd={(track) =>
                          addItem(
                            { soundId: track.id },
                            `Added ${track.title}.`,
                          )
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </StudioPanel>
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
            <Dialog.Title>{t('playlistEditor.uploadCover')}</Dialog.Title>
            <Dialog.Description>
              Choose an image for this {kindLabel}&apos;s cover art.
            </Dialog.Description>
            <div className="mt-4">
              <FilePicker
                labels={{
                  title: t('studioPlaylistEditorView.coverImage'),
                  description: t('studioPlaylistEditorView.jpegPngWebpOrGif'),
                  browse: uploadingImage ? 'Uploading…' : 'Choose image',
                }}
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadingImage}
                onFiles={(files) => void uploadCover(files)}
              />
            </div>
            <Dialog.Actions>
              <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
            </Dialog.Actions>
          </Dialog.Root>

          <ConfirmDialog
            isOpen={pendingRemove !== null}
            title={t('studioPlaylistEditor.removeTrackTitle', {
              title: pendingRemove?.title ?? '',
            })}
            description={t('studioPlaylistEditor.removeTrackDescription', {
              kind: kindLabel,
            })}
            confirmLabel={t('actions.remove')}
            destructive
            onCancel={() => setPendingRemove(null)}
            onConfirm={() => {
              if (!pendingRemove) {
                return;
              }
              const id = pendingRemove.id;
              setPendingRemove(null);
              void (async () => {
                try {
                  const r = await removeStudioCollectionItem(slug, id);
                  if (!r.ok) {
                    toast.error(r.error);
                    return;
                  }
                  toast.success(t('toasts.playlistItemRemoved'));
                  await refreshItems();
                } catch {
                  toast.error(t('toasts.playlistItemRemoveFailed'));
                }
              })();
            }}
          />

          <ConfirmDialog
            isOpen={pendingCoverDelete}
            title={t('studioPlaylistEditor.removeCoverTitle')}
            description={t('studioPlaylistEditor.removeCoverDescription', {
              kind: kindLabel,
            })}
            confirmLabel={t('studioPlaylistEditor.removeCover')}
            destructive
            onCancel={() => setPendingCoverDelete(false)}
            onConfirm={() => {
              setPendingCoverDelete(false);
              void removeCover();
            }}
          />
        </div>
      </div>
    </StudioGate>
  );
}
