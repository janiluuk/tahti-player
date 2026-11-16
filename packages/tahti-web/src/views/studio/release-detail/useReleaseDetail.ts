import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';
import type { Track } from '@tahti-player/model';

import { setReleaseArtworkFromUrl } from '../../../api/image-from-url';
import {
  fetchEditorSource,
  fetchStudioRelease,
  fetchStudioSounds,
  patchStudioRelease,
  removeReleaseArtwork,
  uploadReleaseArtwork,
} from '../../../api/studio';
import type {
  FingerprintMatch,
  StudioRelease,
  StudioReleaseTrack,
  StudioSound,
} from '../../../api/studio-types';
import type { TahtiPlayable } from '../../../api/types';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import { toastWithUndo } from '../../../lib/undoToast';
import { useEditMode } from '../../../lib/useEditMode';
import { useSnapshotFetch } from '../../../lib/useSnapshotFetch';
import { useAuthStore } from '../../../stores/authStore';
import { usePlayerStore } from '../../../stores/playerStore';

/** Loading, editing, publishing, artwork and playback for one release. */
export function useReleaseDetail(id: string) {
  const user = useAuthStore((state) => state.user);
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);
  const play = usePlayerStore((state) => state.play);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const {
    data: savedRelease,
    loading,
    error: loadError,
    updatedAt,
    retry: retryLoad,
    mutate,
  } = useSnapshotFetch<StudioRelease | null>(
    `studio-release:${user?.id ?? ''}:${id}`,
    async () => {
      const result = await fetchStudioRelease(id);
      if (result.ok) {
        return result.data;
      }
      if (/not found/i.test(result.error)) {
        return null;
      }
      throw new Error(result.error);
    },
  );
  const release = savedRelease ?? null;
  const setRelease = (next: SetStateAction<StudioRelease | null>) =>
    mutate((current) => (typeof next === 'function' ? next(current) : next));
  const [description, setDescription] = useState(
    () => release?.description ?? '',
  );
  const syncedDescription = useRef(description);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(
    () => release?.artworkUrl ?? null,
  );
  const [artworkPickerOpen, setArtworkPickerOpen] = useState(false);
  const [applyingArtwork, setApplyingArtwork] = useState(false);
  const [pendingArtworkDelete, setPendingArtworkDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useEditMode();
  const [soundsById, setSoundsById] = useState<Record<string, StudioSound>>({});

  // A refresh replaces the description only while the form still shows the
  // last loaded one, so typing is never overwritten.
  useEffect(() => {
    if (!release) {
      return;
    }
    const next = release.description ?? '';
    const previous = syncedDescription.current;
    syncedDescription.current = next;
    setDescription((current) => (current === previous ? next : current));
    setArtworkPreview(release.artworkUrl ?? null);
  }, [updatedAt, id]);

  useEffect(() => {
    let cancelled = false;
    fetchStudioSounds()
      .then((res) => {
        if (!cancelled) {
          setSoundsById(Object.fromEntries(res.data.map((s) => [s.id, s])));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /** Non-hearthis EMBED_ONLY sounds have no Tahti-hosted audio and no
   * shared-player widget — same accepted gap as the Collection editor's
   * TrackTable. */
  const buildPlayable = async (
    releaseTrack: StudioReleaseTrack,
  ): Promise<TahtiPlayable | null> => {
    if (!releaseTrack.soundId) {
      return null;
    }
    const sound = soundsById[releaseTrack.soundId];
    if (sound) {
      const hearthis = playableFromStudioHearthis(sound);
      if (hearthis) {
        return hearthis;
      }
      if (sound.embedProvider && sound.embedProvider !== 'HEARTHIS') {
        return null;
      }
    }
    const { data } = await fetchEditorSource(releaseTrack.soundId);
    if (!data.url) {
      return null;
    }
    return {
      id: `sound:${releaseTrack.soundId}`,
      kind: 'sound',
      title: data.title || releaseTrack.title,
      artist: user?.displayName ?? 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    };
  };

  const releaseTracks: Track[] = useMemo(
    () =>
      (release?.tracks ?? []).map((t) => ({
        title: t.title,
        artists: [{ name: 'You', roles: ['performer'] }],
        durationMs:
          t.durationSec != null ? Math.round(t.durationSec * 1000) : undefined,
        source: { provider: 'tahti', id: t.id },
      })),
    [release?.tracks],
  );

  // Smart-link targets are saved by their own panel ("Save destinations");
  // this saves the description only, so half-typed destinations can't leak in.
  const save = async () => {
    setSaving(true);
    try {
      const result = await patchStudioRelease(id, { description });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRelease(result.data);
      toast.success(i18n.t('web:toasts.releaseSaved'));
    } catch {
      toast.error(i18n.t('web:toasts.couldNotSaveRelease'));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const r = await patchStudioRelease(id, { state: 'PUBLISHED' });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setRelease(r.data);
      toastWithUndo(i18n.t('web:batch56.published'), {
        undo: () => patchStudioRelease(id, { state: 'DRAFT' }),
        undoneMessage: i18n.t('web:batch56.backToDraft'),
        onUndone: (result) => setRelease(result.data),
      });
    } catch {
      toast.error(i18n.t('web:toasts.couldNotPublishRelease'));
    } finally {
      setPublishing(false);
    }
  };

  const removeArtwork = async () => {
    const result = await removeReleaseArtwork(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setArtworkPreview(null);
    toast.success(i18n.t('web:toasts.artworkRemoved'));
  };

  const uploadArtworkFile = async (file: File) => {
    const result = await uploadReleaseArtwork(id, file);
    if (!result.ok) {
      return result;
    }
    return { ok: true as const, data: { url: result.artworkUrl } };
  };

  const selectReleaseArtwork = async (
    url: string,
    source: 'upload' | 'gallery',
  ) => {
    if (source === 'upload') {
      setArtworkPreview(url);
      return true;
    }
    const result = await setReleaseArtworkFromUrl(id, url);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setArtworkPreview(result.url);
    return true;
  };

  const applyArtwork = async (file: File) => {
    setApplyingArtwork(true);
    const result = await uploadReleaseArtwork(id, file);
    setApplyingArtwork(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setArtworkPreview(result.artworkUrl);
    toast.success(i18n.t('web:toasts.artworkUploaded'));
    setArtworkPickerOpen(false);
  };

  const applyArtworkFromUrl = async (sourceUrl: string) => {
    setApplyingArtwork(true);
    const result = await setReleaseArtworkFromUrl(id, sourceUrl);
    setApplyingArtwork(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setArtworkPreview(result.url);
    toast.success(i18n.t('web:toasts.artworkSaved'));
    setArtworkPickerOpen(false);
    return true;
  };

  const playFirstTrack = async () => {
    const firstTrack = release?.tracks?.[0];
    if (!firstTrack?.soundId) {
      toast.info(i18n.t('web:toasts.firstTrackNotPlayable'));
      return;
    }
    const source = await fetchEditorSource(firstTrack.soundId);
    if (!source.data.url) {
      toast.info(i18n.t('web:toasts.firstTrackStillPreparing'));
      return;
    }
    play({
      id: `sound:${firstTrack.soundId}`,
      kind: 'sound',
      title: firstTrack.title,
      artist: user?.displayName ?? 'You',
      streamUrl: source.data.url,
      protocol: source.data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const updateTrackFingerprint = (
    trackId: string,
    match: FingerprintMatch | null,
  ) => {
    setRelease((prev) =>
      prev
        ? {
            ...prev,
            tracks: prev.tracks?.map((t) =>
              t.id === trackId ? { ...t, fingerprintMatch: match } : t,
            ),
          }
        : prev,
    );
  };

  return {
    user,
    currentId,
    playbackStatus,
    setPlaybackStatus,
    play,
    enqueue,
    release,
    setRelease,
    description,
    setDescription,
    loaded: !loading,
    loadError,
    retryLoad,
    publishing,
    confirmPublish,
    setConfirmPublish,
    artworkPreview,
    artworkPickerOpen,
    setArtworkPickerOpen,
    applyingArtwork,
    pendingArtworkDelete,
    setPendingArtworkDelete,
    saving,
    detailsExpanded,
    setDetailsExpanded,
    soundsById,
    releaseTracks,
    buildPlayable,
    save,
    publish,
    removeArtwork,
    applyArtwork,
    applyArtworkFromUrl,
    uploadArtworkFile,
    selectReleaseArtwork,
    playFirstTrack,
    updateTrackFingerprint,
  };
}
