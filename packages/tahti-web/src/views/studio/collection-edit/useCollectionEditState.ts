import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';
import type { Track } from '@tahti-player/model';

import {
  addStudioCollectionItem,
  fetchCollectionGallery,
  fetchStudioCollection,
  fetchStudioSounds,
  patchStudioCollection,
  removeStudioCollectionItem,
  reorderStudioCollectionItems,
} from '../../../api/studio';
import type {
  CollectionTrackSortMode,
  StudioCollection,
  StudioSound,
} from '../../../api/studio-types';
import { useImageSlotChrome } from '../../../components/imageSlot/useImageSlotChrome';
import { collectionItemToTrack } from '../../../lib/collectionTrackMapping';
import { toastWithUndo } from '../../../lib/undoToast';
import { useCollectionImages } from './useCollectionImages';
import { useCollectionPlayback } from './useCollectionPlayback';

/** Loading, editing, tracklist and playback state for one collection. */
export function useCollectionEditState(slug: string) {
  const [col, setCol] = useState<StudioCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [trackSortMode, setTrackSortMode] =
    useState<CollectionTrackSortMode>('MANUAL');
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
    coverFromUrl,
    uploadCoverFile,
    applyCover,
    removeCover,
    removeBackdrop,
    removeSlideshowFrame,
  } = useCollectionImages(slug, setCol);
  const [saving, setSaving] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
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
      if (c.meta.source === 'api' && c.meta.reason) {
        setLoadError(c.meta.reason);
        return;
      }
      setLoadError(null);
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
      setTrackSortMode(c.data.trackSortMode ?? 'MANUAL');
      setCoverUrl(c.data.coverUrl ?? null);
      setGalleryLoaded(g.meta.loaded);
      if (g.meta.loaded) {
        setBackdropUrl(g.data.slideshowImages[0] ?? c.data.backdropUrl ?? null);
        setSlideshowImages(
          g.data.slideshowImages.length > 0
            ? g.data.slideshowImages
            : c.data.backdropUrl
              ? [c.data.backdropUrl]
              : [],
        );
      } else {
        setBackdropUrl(c.data.backdropUrl ?? null);
        setSlideshowImages(c.data.backdropUrl ? [c.data.backdropUrl] : []);
      }
    });
  };

  useEffect(() => {
    reload();
  }, [slug]);

  const refreshItems = async () => {
    try {
      const fresh = await fetchStudioCollection(slug);
      if (fresh.meta.source === 'api' && fresh.meta.reason) {
        toast.error(i18n.t('web:toasts.couldNotRefreshTracklist'));
        return null;
      }
      setCol((current) =>
        current ? { ...current, items: fresh.data.items } : fresh.data,
      );
      return fresh.data.items;
    } catch {
      toast.error(i18n.t('web:toasts.couldNotRefreshTracklist'));
      return null;
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

  const removeAddedSound = async (
    soundId: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const fresh = await refreshItems();
    const item = fresh?.filter((entry) => entry.sound?.id === soundId).at(-1);
    if (!item) {
      return { ok: false, error: 'That track is no longer in the tracklist.' };
    }
    const result = await removeStudioCollectionItem(slug, item.id);
    if (result.ok) {
      void refreshItems();
    }
    return result;
  };

  const addSound = async (sound: StudioSound) => {
    setAddBusyId(sound.id);
    const result = await addStudioCollectionItem(slug, sound.id);
    setAddBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    // Refresh only the tracklist: a full reload() would reset the details
    // form and drop unsaved edits.
    const fresh = await refreshItems();
    const added = fresh?.filter((item) => item.sound?.id === sound.id).at(-1);
    if (!added) {
      toast.success(`${sound.title} added.`);
      return;
    }
    toastWithUndo(`${sound.title} added.`, {
      undo: () => removeStudioCollectionItem(slug, added.id),
      undoneMessage: `${sound.title} removed.`,
      onUndone: () => void refreshItems(),
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
    ).then((result) => {
      if (result.ok) {
        toast.success(i18n.t('web:toasts.collectionTracklistReordered'));
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
        toast.info(i18n.t('web:toasts.collectionGenresTrimmed'));
      }
      const result = await patchStudioCollection(slug, {
        name: name.trim() || slug,
        description: description.trim() || null,
        style,
        isPublic: visibility === 'PUBLIC',
        visibility,
        releaseDate: releaseDate || null,
        genres: genreList.slice(0, 5),
        trackSortMode,
        backdropUrl: backdropUrl?.trim() || null,
        ...(galleryLoaded
          ? {
              gallery: {
                slideshowImages,
                galleryMode:
                  slideshowImages.length > 1 ? 'STATIC_SLIDESHOW' : 'NONE',
              },
            }
          : {}),
      });
      if (!result.ok) {
        toast.error(result.error);
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
      toast.success(i18n.t('web:toasts.collectionDetailsSaved'));
    } catch {
      toast.error(i18n.t('web:toasts.collectionDetailsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const backdropChrome = useImageSlotChrome({ onClear: removeBackdrop });

  return {
    col,
    loadError,
    reload,
    sounds,
    addPickerOpen,
    setAddPickerOpen,
    addBusyId,
    name,
    setName,
    description,
    setDescription,
    style,
    setStyle,
    visibility,
    setVisibility,
    releaseDate,
    setReleaseDate,
    genres,
    setGenres,
    trackSortMode,
    setTrackSortMode,
    coverUrl,
    backdropUrl,
    slideshowImages,
    uploadTarget,
    setUploadTarget,
    uploadingImage,
    pendingCoverDelete,
    setPendingCoverDelete,
    pendingFrameDelete,
    setPendingFrameDelete,
    uploadImage,
    coverFromUrl,
    uploadCoverFile,
    applyCover,
    removeCover,
    removeSlideshowFrame,
    saving,
    pendingRemove,
    setPendingRemove,
    items,
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
    isAlbumLike,
    tracks,
    existingSoundIds,
    nowPlayingItem,
    addSound,
    removeAddedSound,
    onReorder,
    saveMeta,
    refreshItems,
    backdropChrome,
  };
}

export type CollectionEditState = ReturnType<typeof useCollectionEditState>;
