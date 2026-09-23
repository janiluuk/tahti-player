import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Track } from '@tahti-player/model';

import {
  addStudioCollectionItem,
  fetchCollectionGallery,
  fetchStudioCollection,
  fetchStudioSounds,
  patchStudioCollection,
  reorderStudioCollectionItems,
} from '../../../api/studio';
import type { StudioCollection, StudioSound } from '../../../api/studio-types';
import { useImageSlotChrome } from '../../../components/imageSlot/useImageSlotChrome';
import { collectionItemToTrack } from '../../../lib/collectionTrackMapping';
import { useCollectionImages } from './useCollectionImages';
import { useCollectionPlayback } from './useCollectionPlayback';

/** Loading, editing, tracklist and playback state for one collection. */
export function useCollectionEditState(slug: string) {
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
        gallery: {
          slideshowImages,
          galleryMode: slideshowImages.length > 1 ? 'STATIC_SLIDESHOW' : 'NONE',
        },
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
      toast.success('Collection details saved.');
    } catch {
      toast.error('Could not save the collection details.');
    } finally {
      setSaving(false);
    }
  };

  const backdropChrome = useImageSlotChrome({ onClear: removeBackdrop });

  return {
    col,
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
    removeCover,
    removeSlideshowFrame,
    saving,
    detailsExpanded,
    setDetailsExpanded,
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
    onReorder,
    saveMeta,
    refreshItems,
    backdropChrome,
  };
}

export type CollectionEditState = ReturnType<typeof useCollectionEditState>;
