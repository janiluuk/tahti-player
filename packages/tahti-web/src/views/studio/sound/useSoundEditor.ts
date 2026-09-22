import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchEditorDraft,
  fetchEditorSource,
  fetchStudioSound,
  patchStudioSound,
  renderEditorDraft,
} from '../../../api/studio';
import {
  createDefaultEditList,
  type EditList,
  type StudioSound,
} from '../../../api/studio-types';
import type { TrackVisibility } from '../../../components/AudienceVisibilitySection';
import { SELECTABLE_CONTENT_TYPES } from '../../../content/contentTypes';
import { usePolling } from '../../../hooks/usePolling';
import { autoTrimCuts } from '../../../lib/autoTrimCuts';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import { capitalizeGenre } from '../../../lib/genres';
import { isPinned } from '../../../lib/pinnedTracks';
import { useMasteringFeatureStore } from '../../../plugins/mastering/store';
import { useAuthStore } from '../../../stores/authStore';
import { usePlayerStore } from '../../../stores/playerStore';

/** Loading, editing, playback and quick-render actions for one sound. */
export function useSoundEditor(id: string) {
  const user = useAuthStore((state) => state.user);
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const currentId = usePlayerStore((state) => state.currentId);
  const playerStatus = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const playerDuration = usePlayerStore((state) => state.duration);
  const play = usePlayerStore((state) => state.play);
  const setPlayerStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const [item, setItem] = useState<StudioSound | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [contentType, setContentType] = useState('TRACK');
  const [visibility, setVisibility] = useState<TrackVisibility>('PUBLIC');
  const [fanTierIds, setFanTierIds] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState('');
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [tab, setTab] = useState<'details' | 'playlists' | 'insights'>(
    'details',
  );
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [rotationBusy, setRotationBusy] = useState(false);
  const [playBusy, setPlayBusy] = useState(false);

  const [editList, setEditList] = useState<EditList | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [quickBusy, setQuickBusy] = useState<'normalize' | 'trim' | null>(null);
  const [quickMsg, setQuickMsg] = useState<string | null>(null);
  const [revisionTick, setRevisionTick] = useState(0);

  useEffect(() => {
    void fetchStudioSound(id).then((res) => {
      setItem(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description ?? '');
      setGenre(res.data.genre ? capitalizeGenre(res.data.genre) : '');
      setContentType(res.data.contentType ?? 'TRACK');
      setVisibility(
        res.data.visibility ??
          (res.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      );
      setFanTierIds(res.data.fanTierIds ?? []);
      setReleaseDate(res.data.releaseDate ?? '');
      setDownloadsEnabled(res.data.downloadsEnabled ?? false);
      setCommentsEnabled(res.data.commentsEnabled ?? true);
    });
    void fetchEditorDraft(id).then((res) => {
      setEditList(res.data.editList);
      const level = res.data.editorPeaks?.levels?.[0];
      setPeaks(level && level.length > 0 ? level : []);
    });
  }, [id]);

  useEffect(() => {
    if (contentType === 'CLIP' && tab === 'playlists') {
      setTab('details');
    }
  }, [contentType, tab]);

  const status = item?.status;
  // Landing here straight from Upload (see StudioUploadView), or a refresh /
  // bookmark of this URL, both need this page to make sense before the file
  // has finished transcoding — poll until it leaves PENDING/PROCESSING
  // rather than silently showing a half-broken "ready" editor.
  usePolling(
    () => {
      void fetchStudioSound(id).then((res) => setItem(res.data));
    },
    4000,
    Boolean(status && status !== 'READY' && status !== 'ERROR'),
  );

  /** Runs a `patchStudioSound` and reports the outcome through a toast. */
  const patchAndReport = async (
    patch: Parameters<typeof patchStudioSound>[1],
    success: string,
    onOk?: () => void,
  ): Promise<boolean> => {
    try {
      const result = await patchStudioSound(id, patch);
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      setItem(result.data);
      onOk?.();
      toast.success(success);
      return true;
    } catch {
      toast.error('Could not update the track.');
      return false;
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await patchAndReport(
        {
          title,
          description,
          ...(isAudioClip ? { genre: null } : { genre: genre || null }),
          contentType,
          isPublic: visibility === 'PUBLIC',
          visibility,
          fanTierIds,
          ...(isAudioClip
            ? { releaseDate: null }
            : { releaseDate: releaseDate || null }),
          downloadsEnabled,
          commentsEnabled,
        },
        'Saved.',
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async () => {
    if (!item) {
      return;
    }
    const next = !isPinned(item);
    setPinBusy(true);
    try {
      await patchAndReport(
        { pinned: next },
        next ? 'Pinned to your public page.' : 'Unpinned.',
      );
    } finally {
      setPinBusy(false);
    }
  };

  const toggleRotation = async () => {
    if (!item) {
      return;
    }
    const next = !item.isFallback;
    setRotationBusy(true);
    try {
      await patchAndReport(
        { isFallback: next },
        next ? 'Added to your 24/7 rotation.' : 'Removed from rotation.',
      );
    } finally {
      setRotationBusy(false);
    }
  };

  const moveToStash = async () => {
    setSaving(true);
    try {
      await patchAndReport(
        { visibility: 'PRIVATE', isPublic: false },
        'Moved to your private stash.',
        () => setVisibility('PRIVATE'),
      );
    } finally {
      setSaving(false);
    }
  };

  const startPlayback = async (startAt?: number) => {
    if (!item) {
      return;
    }
    const playableId = `sound:${id}`;
    if (currentId === playableId) {
      if (startAt !== undefined) {
        seekTo(startAt);
      }
      setPlayerStatus('playing');
      return;
    }
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      play(hearthis);
      if (startAt !== undefined) {
        seekTo(startAt);
      }
      return;
    }
    setPlayBusy(true);
    try {
      const { data } = await fetchEditorSource(id);
      play({
        id: playableId,
        kind: 'sound',
        title: item.title,
        artist: item.artistName || user?.displayName || 'You',
        coverUrl: item.bannerUrl ?? undefined,
        streamUrl: data.url,
        protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
      });
      if (startAt !== undefined) {
        seekTo(startAt);
      }
    } catch {
      toast.error('Could not load the audio.');
    } finally {
      setPlayBusy(false);
    }
  };

  const runQuickRender = async (
    kind: 'normalize' | 'trim',
    next: EditList,
    label: string,
  ) => {
    setQuickBusy(kind);
    setQuickMsg(null);
    const result = await renderEditorDraft(id, next, label);
    setQuickBusy(null);
    if (!result.ok) {
      setQuickMsg(result.error);
      return;
    }
    setEditList(next);
    setQuickMsg(
      `Queued as version — the previous version stays available below.`,
    );
    setRevisionTick((tick) => tick + 1);
  };

  const onNormalize = () => {
    const base = editList ?? createDefaultEditList(item?.durationSec ?? 180);
    void runQuickRender(
      'normalize',
      { ...base, loudnorm: { ...base.loudnorm, enabled: true } },
      'Quick normalize',
    );
  };

  const onAutoTrim = () => {
    const base = editList ?? createDefaultEditList(item?.durationSec ?? 180);
    const cuts = autoTrimCuts(peaks, base.sourceDuration).filter(
      (cut) =>
        !base.cuts.some(
          (existing) =>
            Math.abs(existing.start - cut.start) < 0.05 &&
            Math.abs(existing.end - cut.end) < 0.05,
        ),
    );
    if (cuts.length === 0) {
      setQuickMsg('No new leading/trailing silence to trim.');
      return;
    }
    void runQuickRender(
      'trim',
      { ...base, cuts: [...base.cuts, ...cuts] },
      'Quick auto-trim',
    );
  };

  const isAudioClip = contentType === 'CLIP';
  const pinned = item ? isPinned(item) : false;
  const hasError = status === 'ERROR';
  const notReady = status != null && status !== 'READY' && !hasError;
  const isCurrent = currentId === `sound:${id}`;
  const isPlaying =
    isCurrent && (playerStatus === 'playing' || playerStatus === 'loading');
  const contentTypeLabel =
    SELECTABLE_CONTENT_TYPES.find((option) => option.id === contentType)
      ?.label ?? contentType;

  return {
    user,
    masteringEnabled,
    currentId,
    playerStatus,
    currentTime,
    playerDuration,
    setPlayerStatus,
    item,
    setItem,
    title,
    setTitle,
    description,
    setDescription,
    genre,
    setGenre,
    contentType,
    setContentType,
    visibility,
    setVisibility,
    fanTierIds,
    setFanTierIds,
    releaseDate,
    setReleaseDate,
    downloadsEnabled,
    setDownloadsEnabled,
    commentsEnabled,
    setCommentsEnabled,
    tab,
    setTab,
    playlistOpen,
    setPlaylistOpen,
    saving,
    pinBusy,
    rotationBusy,
    playBusy,
    editList,
    peaks,
    quickBusy,
    quickMsg,
    revisionTick,
    status,
    save,
    togglePin,
    toggleRotation,
    moveToStash,
    startPlayback,
    onNormalize,
    onAutoTrim,
    isAudioClip,
    pinned,
    hasError,
    notReady,
    isCurrent,
    isPlaying,
    contentTypeLabel,
  };
}

export type SoundEditorState = ReturnType<typeof useSoundEditor>;
