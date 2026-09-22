import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  ImageIcon,
  ListPlusIcon,
  MusicIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
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
  FilterChips,
  Input,
  SaveButton,
  Select,
  Textarea,
  Tooltip,
  TrackTable,
} from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  fetchCollectionGallery,
  fetchStudioCollection,
  fetchStudioSounds,
  patchCollectionGallery,
  patchStudioCollection,
  removeStudioCollectionItem,
  reorderStudioCollectionItems,
} from '../../api/studio';
import type { StudioCollection, StudioSound } from '../../api/studio-types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../components/EntitySocialHeader';
import { ImageSlotDeleteBadge } from '../../components/imageSlot/ImageSlotDeleteBadge';
import { ImageSlotPreviewDialog } from '../../components/imageSlot/ImageSlotPreviewDialog';
import { useImageSlotChrome } from '../../components/imageSlot/useImageSlotChrome';
import { PageLoading } from '../../components/PageStates';
import { StudioCollectionMoreMenu } from '../../components/StudioCollectionMoreMenu';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { COLLECTION_STYLES } from '../../content/collectionStyles';
import { collectionItemToTrack } from '../../lib/collectionTrackMapping';
import { trackTableLabels } from '../../lib/trackTableLabels';
import { LibrarySectionTabs } from '../LibraryView';
import { AddTracksDialog } from './collection-edit/AddTracksDialog';
import { NowPlayingBar } from './collection-edit/NowPlayingBar';
import { useCollectionImages } from './collection-edit/useCollectionImages';
import { useCollectionPlayback } from './collection-edit/useCollectionPlayback';

export function StudioCollectionEditView({
  slug,
  nav = 'studio',
}: {
  slug: string;
  /** Which top navigation this page was reached through. */
  nav?: 'studio' | 'library';
}) {
  const [col, setCol] = useState<StudioCollection | null>(null);
  const [sounds, setSounds] = useState<StudioSound[]>([]);
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
  const {
    coverUrl,
    setCoverUrl,
    backdropUrl,
    setBackdropUrl,
    slideshowImages,
    setSlideshowImages,
    uploadTarget,
    setUploadTarget,
    uploadingImage,
    pendingCoverDelete,
    setPendingCoverDelete,
    pendingFrameDelete,
    setPendingFrameDelete,
    uploadImage,
    removeCover,
    removeBackdrop,
    removeSlideshowFrame,
  } = useCollectionImages(slug, setCol);
  const [saving, setSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const reload = () => {
    void Promise.all([
      fetchStudioCollection(slug),
      fetchStudioSounds(),
      fetchCollectionGallery(slug),
    ]).then(([c, a, g]) => {
      setCol(c.data);
      setSounds(a.data);
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

  const refreshItems = async () => {
    try {
      const fresh = await fetchStudioCollection(slug);
      setCol((current) =>
        current ? { ...current, items: fresh.data.items } : fresh.data,
      );
    } catch {
      toast.error('Could not refresh the tracklist.');
    }
  };

  const items = col?.items ?? [];
  const {
    queue,
    enqueue,
    setStatus,
    buildPlayable,
    currentId,
    isPlaying,
    playSound,
    playAllTracks,
    queueAllTracks,
    togglePlayItem,
  } = useCollectionPlayback(items);
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

  const tracks: Track[] = useMemo(
    () => items.map(collectionItemToTrack),
    [items],
  );

  const existingSoundIds = useMemo(
    () => new Set(items.map((item) => item.sound?.id).filter(Boolean)),
    [items],
  );

  const nowPlayingItem = items.find(
    (i) => i.sound && currentId === `sound:${i.sound.id}`,
  );

  const addSound = async (sound: StudioSound) => {
    setAddBusyId(sound.id);
    const result = await addStudioCollectionItem(slug, sound.id);
    setAddBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${sound.title} added.`);
    // Refresh only the tracklist: a full reload() would reset the details
    // form and drop unsaved edits.
    void refreshItems();
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
    ).then((result) => {
      if (result.ok) {
        toast.success('Tracklist reordered.');
      } else {
        toast.error(result.error);
        void refreshItems();
      }
    });
  };

  const saveMeta = async () => {
    setSaving(true);
    try {
      const genreList = genres
        .split(',')
        .map((genre) => genre.trim())
        .filter(Boolean);
      if (genreList.length > 5) {
        toast.info('Only the first 5 genres are kept.');
      }
      const result = await patchStudioCollection(slug, {
        name: name.trim() || slug,
        description: description.trim() || null,
        style,
        isPublic: visibility === 'PUBLIC',
        visibility,
        releaseDate: releaseDate || null,
        genres: genreList.slice(0, 5),
        backdropUrl: backdropUrl?.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const galleryResult = await patchCollectionGallery(slug, {
        slideshowImages,
        galleryMode: slideshowImages.length > 1 ? 'STATIC_SLIDESHOW' : 'NONE',
      });
      if (!galleryResult.ok) {
        // The details are already saved; say which half failed.
        setCol((c) =>
          c ? { ...c, ...result.data, items: c.items } : result.data,
        );
        toast.error(
          `Details saved, but the backdrop could not be saved: ${galleryResult.error}`,
        );
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
    } catch {
      toast.error('Could not save the collection details.');
    } finally {
      setSaving(false);
    }
  };

  const backdropChrome = useImageSlotChrome({ onClear: removeBackdrop });

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        {nav === 'library' ? (
          <LibrarySectionTabs active="collections" />
        ) : (
          <StudioNav current="/studio/collections" />
        )}
        <Tooltip content="Back to Collections" side="right">
          <Link
            to={
              nav === 'library' ? '/library/collections' : '/studio/collections'
            }
            aria-label="Back to Collections"
            className="text-foreground-secondary hover:bg-background-secondary -mt-2 inline-flex size-8 w-fit items-center justify-center rounded-full"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Link>
        </Tooltip>
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
              onImageDelete={
                coverUrl ? () => setPendingCoverDelete(true) : undefined
              }
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
                  <div className="group relative">
                    <Tooltip
                      content={
                        backdropUrl ? 'Preview backdrop' : 'Change backdrop'
                      }
                      side="top"
                    >
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="bg-background border-border rounded-md border-(length:--border-width)"
                        aria-label={
                          backdropUrl ? 'Preview backdrop' : 'Change backdrop'
                        }
                        onClick={() =>
                          backdropUrl
                            ? backdropChrome.openPreview()
                            : setUploadTarget('backdrop')
                        }
                      >
                        <ImageIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    {backdropUrl ? (
                      <ImageSlotDeleteBadge
                        label="Backdrop"
                        onClick={backdropChrome.requestDelete}
                      />
                    ) : null}
                  </div>
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
                <StudioCollectionMoreMenu
                  col={col}
                  kindLabel={isAlbumLike ? 'album' : 'collection'}
                />
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
                  <Input
                    label="Release date"
                    type="date"
                    value={releaseDate}
                    onChange={(event) => setReleaseDate(event.target.value)}
                  />
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
                    <FilterChips
                      items={COLLECTION_STYLES}
                      selected={style}
                      onChange={setStyle}
                    />
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
                {nowPlayingItem?.sound && (
                  <NowPlayingBar title={nowPlayingItem.sound.title} />
                )}
              </div>

              {items.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No tracks yet — add sound items below."
                />
              ) : (
                <div className="min-h-[200px]">
                  <TrackTable
                    tracks={tracks}
                    labels={trackTableLabels}
                    getItemId={(_t, index) => items[index]?.id ?? String(index)}
                    features={{
                      header: true,
                      reorderable: true,
                      filterable: true,
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
                        if (item) {
                          togglePlayItem(item);
                        }
                      },
                      onAddToQueue: (t) => {
                        const item = items.find((i) => i.id === t.source.id);
                        if (item?.sound) {
                          void buildPlayable(item.sound).then((playable) => {
                            if (playable) {
                              enqueue(playable);
                            }
                          });
                        }
                      },
                    }}
                    meta={{
                      isCurrentTrack: (track) => {
                        const item = items.find(
                          (candidate) => candidate.id === track.source.id,
                        );
                        return Boolean(
                          item?.sound && currentId === `sound:${item.sound.id}`,
                        );
                      },
                      isTrackPlaying: (track) => {
                        const item = items.find(
                          (candidate) => candidate.id === track.source.id,
                        );
                        return Boolean(
                          item?.sound &&
                          currentId === `sound:${item.sound.id}` &&
                          isPlaying,
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
            </StudioPanel>
          </>
        )}
        <AddTracksDialog
          isOpen={addPickerOpen}
          onClose={() => setAddPickerOpen(false)}
          title={`Add content to ${isAlbumLike ? 'album' : 'collection'}`}
          sounds={sounds}
          existingSoundIds={existingSoundIds}
          addBusyId={addBusyId}
          isPreviewing={(sound) =>
            currentId === `sound:${sound.id}` && isPlaying
          }
          onPreview={(sound) => void playSound(sound)}
          onPause={() => setStatus('paused')}
          onAdd={(sound) => void addSound(sound)}
        />
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

        <ConfirmDialog
          isOpen={pendingRemove !== null}
          title={`Remove "${pendingRemove?.title}"?`}
          description={`This removes the track from this ${isAlbumLike ? 'album' : 'collection'}. It stays in your library.`}
          confirmLabel="Remove"
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => {
            if (!pendingRemove) {
              return;
            }
            const id = pendingRemove.id;
            setPendingRemove(null);
            void removeStudioCollectionItem(slug, id).then((result) => {
              if (result.ok) {
                toast.success('Track removed.');
                void refreshItems();
              } else {
                toast.error(result.error);
              }
            });
          }}
        />

        <ConfirmDialog
          isOpen={pendingCoverDelete}
          title="Remove cover image?"
          description="The collection will fall back to its default placeholder until you upload a new cover."
          confirmLabel="Remove cover"
          onCancel={() => setPendingCoverDelete(false)}
          onConfirm={() => {
            setPendingCoverDelete(false);
            void removeCover();
          }}
        />

        <ImageSlotPreviewDialog
          isOpen={backdropChrome.previewOpen && pendingFrameDelete === null}
          onClose={backdropChrome.closePreview}
          label="Backdrop"
          src={backdropUrl}
          frames={
            slideshowImages.length > 1
              ? slideshowImages.map((url) => ({
                  url,
                  onDelete: () => setPendingFrameDelete(url),
                }))
              : undefined
          }
          onChangeClick={() => {
            backdropChrome.closePreview();
            setUploadTarget('backdrop');
          }}
          confirmOpen={backdropChrome.confirmOpen}
          clearing={backdropChrome.clearing}
          onRequestDelete={backdropChrome.requestDelete}
          onCancelDelete={backdropChrome.cancelDelete}
          onConfirmDelete={backdropChrome.confirmDelete}
        />

        <ConfirmDialog
          isOpen={pendingFrameDelete !== null}
          title="Remove this image from the backdrop?"
          description="It will be removed from the slideshow immediately."
          confirmLabel="Remove"
          onCancel={() => setPendingFrameDelete(null)}
          onConfirm={() => {
            const url = pendingFrameDelete;
            setPendingFrameDelete(null);
            if (url) {
              void removeSlideshowFrame(url);
            }
          }}
        />
      </div>
    </StudioGate>
  );
}
