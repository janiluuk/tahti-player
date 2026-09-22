import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Track } from '@tahti-player/model';

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
  const [release, setRelease] = useState<StudioRelease | null>(null);
  const [description, setDescription] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [artworkPickerOpen, setArtworkPickerOpen] = useState(false);
  const [applyingArtwork, setApplyingArtwork] = useState(false);
  const [pendingArtworkDelete, setPendingArtworkDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [soundsById, setSoundsById] = useState<Record<string, StudioSound>>({});

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetchStudioRelease(id)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setRelease(null);
          toast.error(result.error);
          return;
        }
        setRelease(result.data);
        setDescription(result.data.description ?? '');
        setArtworkPreview(result.data.artworkUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setRelease(null);
          toast.error('Could not load the release.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      toast.success('Saved.');
    } catch {
      toast.error('Could not save the release.');
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
      toast.success('Published.');
    } catch {
      toast.error('Could not publish the release.');
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
    toast.success('Artwork removed.');
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
    toast.success('Artwork uploaded.');
    setArtworkPickerOpen(false);
  };

  const playFirstTrack = async () => {
    const firstTrack = release?.tracks?.[0];
    if (!firstTrack?.soundId) {
      toast.info('The first track is not playable yet.');
      return;
    }
    const source = await fetchEditorSource(firstTrack.soundId);
    if (!source.data.url) {
      toast.info('The first track is still being prepared.');
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
    loaded,
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
    playFirstTrack,
    updateTrackFingerprint,
  };
}
