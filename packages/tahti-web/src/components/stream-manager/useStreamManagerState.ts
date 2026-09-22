import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchChannelManageStats,
  fetchRtmpTargets,
  fetchSignalStatus,
  fetchStreamOverlay,
  pauseChannelRotation,
  postEndBroadcast,
  previousChannelRotation,
  resumeChannelRotation,
  skipChannelRotation,
  type ChannelManageStats,
  type RtmpTarget,
  type SignalStatus,
} from '../../api/broadcast';
import { fetchChannel } from '../../api/client';
import {
  fetchEditorSource,
  fetchStudioCollection,
  fetchStudioCollections,
  patchStudioSound,
} from '../../api/studio';
import {
  fetchProgramme,
  patchProgramme,
  type ProgrammeItem,
  type ProgrammeView,
} from '../../api/studio-extras';
import type { StudioCollection } from '../../api/studio-types';
import { usePolling } from '../../hooks/usePolling';
import {
  collectionRotationSoundIds,
  planCollectionRotationApply,
} from '../../lib/rotationCollectionApply';
import { useBroadcastPresenceStore } from '../../stores/broadcastPresenceStore';
import { usePlayerStore } from '../../stores/playerStore';

export const STATS_POLL_MS = 5000;
export const STREAM_POLL_MS = 15000;
export const SECOND_MS = 1000;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;

export function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;
  return hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

type RotationPlayback = {
  title: string;
  artistName: string;
  artworkUrl: string | null;
  observedAt: number;
  item: ProgrammeItem | null;
};

/** Signal/stats polling, rotation playback tracking, and the playlist/overlay/
 * end-stream dialog actions shared across the Stream Manager panel's pieces. */
export function useStreamManagerState({
  slug,
  channelState,
  isPlaying = false,
  onEnded,
  onRotationChange,
  readOnly = false,
  defaultExpanded = false,
}: {
  slug: string;
  channelState: string;
  isPlaying?: boolean;
  onPlaybackToggle?: () => void;
  onEnded?: () => void;
  onRotationChange?: (playing: boolean) => void;
  readOnly?: boolean;
  defaultExpanded?: boolean;
}) {
  const [signal, setSignal] = useState<SignalStatus | null>(null);
  const [stats, setStats] = useState<ChannelManageStats | null>(null);
  const [signalError, setSignalError] = useState(false);
  const [targets, setTargets] = useState<RtmpTarget[]>([]);
  const [rotation, setRotation] = useState<RotationPlayback | null>(null);
  const [rotationPaused, setRotationPaused] = useState(false);
  const rotationTitleRef = useRef<string | null>(null);
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [now, setNow] = useState(Date.now());
  const [ending, setEnding] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transportBusy, setTransportBusy] = useState<
    'skip' | 'previous' | 'pause' | 'resume' | null
  >(null);
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState('');
  const [selectedCollection, setSelectedCollection] =
    useState<StudioCollection | null>(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [pendingApply, setPendingApply] = useState<{
    replace: boolean;
  } | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [rotationBusy, setRotationBusy] = useState(false);
  const [rotationMsg, setRotationMsg] = useState<string | null>(null);
  const [liveStartedAt, setLiveStartedAt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'rotation' | 'stats'>('rotation');
  // Collapsed by default while the fallback rotation is carrying the
  // station — most visits just want to see what's playing and skip/pause
  // it, not the full stats grid and playlist-add form.
  const [rotationExpanded, setRotationExpanded] = useState(defaultExpanded);
  const [overlayShowTitle, setOverlayShowTitle] = useState<boolean | null>(
    null,
  );
  const [overlayModalOpen, setOverlayModalOpen] = useState(false);
  const canControl = !readOnly;

  useEffect(() => {
    void fetchStreamOverlay().then((result) =>
      setOverlayShowTitle(result.data.streamOverlayShowTitle),
    );
  }, []);

  useEffect(() => {
    void fetchStudioCollections().then((r) => setCollections(r.data));
  }, []);

  const pollStats = useCallback(async () => {
    const [signalResult, statsResult] = await Promise.all([
      fetchSignalStatus(),
      fetchChannelManageStats(slug),
    ]);
    setSignal(signalResult.data);
    useBroadcastPresenceStore
      .getState()
      .setSignalConnected(Boolean(signalResult.data.connected));
    setStats(statsResult.data);
    setSignalError(
      signalResult.meta.source === 'api' &&
        Boolean(signalResult.meta.reason) &&
        statsResult.data == null,
    );
  }, [slug]);

  useEffect(() => {
    void pollStats();
  }, [pollStats]);
  usePolling(() => {
    void pollStats();
  }, STATS_POLL_MS);

  const pollStream = useCallback(async () => {
    const [targetResult, programmeResult, channel] = await Promise.all([
      fetchRtmpTargets(),
      fetchProgramme(),
      fetchChannel(slug)
        .then((result) => result.data)
        .catch(() => null),
    ]);
    setTargets(targetResult.data.filter((target) => target.enabled));
    setProgramme(programmeResult.data);
    const nowPlaying = channel?.nowPlaying;
    if (!nowPlaying) {
      setRotation(null);
      setRotationPaused(false);
      rotationTitleRef.current = null;
      return;
    }
    if (rotationTitleRef.current !== nowPlaying.title) {
      setRotationPaused(false);
      rotationTitleRef.current = nowPlaying.title;
    }
    const item =
      programmeResult.data.items.find(
        (candidate) => candidate.title === nowPlaying.title,
      ) ?? null;
    setRotation((current) =>
      current?.title === nowPlaying.title
        ? {
            ...current,
            artistName: nowPlaying.artistName,
            artworkUrl: nowPlaying.artworkUrl,
            item,
          }
        : {
            title: nowPlaying.title,
            artistName: nowPlaying.artistName,
            artworkUrl: nowPlaying.artworkUrl,
            observedAt: Date.now(),
            item,
          },
    );
  }, [slug]);

  useEffect(() => {
    void pollStream();
  }, [pollStream]);
  usePolling(() => {
    void pollStream();
  }, STREAM_POLL_MS);

  usePolling(() => setNow(Date.now()), SECOND_MS);

  const signalConnected = stats?.signalConnected ?? signal?.connected ?? false;
  const liveActive = channelState === 'LIVE' || signalConnected;

  useEffect(() => {
    if (liveActive) {
      setLiveStartedAt((startedAt) => startedAt ?? Date.now());
    } else {
      setLiveStartedAt(null);
    }
  }, [liveActive]);

  const liveDurationSec =
    stats?.liveDurationSec ??
    (liveActive && liveStartedAt !== null
      ? Math.max(0, Math.floor((now - liveStartedAt) / SECOND_MS))
      : null);
  const rotationPlaying =
    Boolean(rotation) && !signalConnected && !rotationPaused;

  useEffect(() => {
    onRotationChange?.(rotationPlaying);
  }, [onRotationChange, rotationPlaying]);

  const bitrate = stats?.audioBitrateKbps ?? signal?.bitrateKbps;
  const listeners = stats?.listeners ?? signal?.listeners;
  const outputLabel = signalConnected
    ? 'Live broadcast'
    : rotationPlaying
      ? 'Track rotation'
      : channelState === 'LIVE'
        ? 'Live output'
        : 'Offline';
  const playerState = signalConnected
    ? 'Live'
    : rotationPlaying
      ? 'Playing'
      : rotation
        ? 'Paused'
        : 'Stopped';
  const durationSec = rotation?.item?.durationSec ?? null;
  const elapsedSinceObserved = rotation
    ? Math.floor((now - rotation.observedAt) / SECOND_MS)
    : 0;

  const editableRotation = useMemo(
    () =>
      (programme?.items ?? [])
        .filter((item) => item.isFallback)
        .sort(
          (left, right) =>
            (left.fallbackOrder ?? 0) - (right.fallbackOrder ?? 0),
        ),
    [programme],
  );
  const availableRotationItems = useMemo(
    () =>
      (programme?.items ?? []).filter(
        (item) => item.status === 'READY' && !item.isFallback,
      ),
    [programme],
  );
  const selectedRotationSoundIds = collectionRotationSoundIds(
    selectedCollection?.items,
  );
  const selectedPlaylistHasRotationTracks = selectedRotationSoundIds.length > 0;

  const handleTransport = async (
    action: 'skip' | 'previous' | 'pause' | 'resume',
  ) => {
    setTransportBusy(action);
    setError(null);
    const fn = {
      skip: skipChannelRotation,
      previous: previousChannelRotation,
      pause: pauseChannelRotation,
      resume: resumeChannelRotation,
    }[action];
    const result = await fn(slug);
    setTransportBusy(null);
    if (!result.ok) {
      setError(result.error);
    } else if (action === 'pause' || action === 'resume') {
      setRotationPaused(action === 'pause');
    }
  };

  const openPlaylistDialog = () => {
    setPlaylistDialogOpen(true);
    if (!selectedCollectionSlug && collections[0]) {
      setSelectedCollectionSlug(collections[0].slug);
      void previewCollection(collections[0].slug);
    }
  };

  const previewCollection = async (collectionSlug: string) => {
    setSelectedCollectionSlug(collectionSlug);
    setPlaylistLoading(true);
    const { data: collection } = await fetchStudioCollection(collectionSlug);
    setSelectedCollection(collection);
    setPlaylistLoading(false);
  };

  const handleApplyCollectionToRotation = async (replace: boolean) => {
    if (!selectedCollectionSlug) {
      return;
    }
    setRotationBusy(true);
    setRotationMsg(null);
    const collection =
      selectedCollection?.slug === selectedCollectionSlug
        ? selectedCollection
        : (await fetchStudioCollection(selectedCollectionSlug)).data;
    const plan = planCollectionRotationApply({
      replace,
      currentFallbackIds: editableRotation.map((item) => item.id),
      incomingSoundIds: collectionRotationSoundIds(collection?.items),
    });
    if (plan.action === 'abort') {
      setRotationBusy(false);
      setRotationMsg(
        plan.reason === 'already-in-rotation'
          ? 'Nothing to add — those tracks are already in the rotation.'
          : 'Nothing to add — that playlist has no tracks.',
      );
      setPlaylistDialogOpen(false);
      return;
    }
    let added = 0;
    let failed = 0;
    for (const soundId of plan.addIds) {
      const result = await patchStudioSound(soundId, {
        isFallback: true,
      });
      if (result.ok) {
        added++;
      } else {
        failed++;
      }
    }
    if (plan.action === 'replace' && failed === 0) {
      for (const soundId of plan.removeIds) {
        await patchStudioSound(soundId, { isFallback: false });
      }
    }
    const programmeResult = await fetchProgramme();
    if (programmeResult.data) {
      setProgramme(programmeResult.data);
    }
    setRotationBusy(false);
    setRotationMsg(
      failed > 0
        ? replace
          ? `${added} track${added === 1 ? '' : 's'} added — ${failed} could not be added. Current rotation was left in place.`
          : `Added ${added} track${added === 1 ? '' : 's'} — ${failed} could not be added.`
        : `${replace ? 'Replaced rotation with' : 'Added'} ${added} track${added === 1 ? '' : 's'}${replace ? '' : ' to the rotation'}.`,
    );
    setPlaylistDialogOpen(false);
  };

  const saveEditableRotation = async (nextRotation: ProgrammeItem[]) => {
    if (!programme) {
      return;
    }
    setRotationBusy(true);
    setRotationMsg(null);
    const positions = new Map(
      nextRotation.map((item, index) => [item.id, index]),
    );
    const result = await patchProgramme({
      fallbackMode: programme.fallbackMode,
      fallbackEnabled: programme.fallbackEnabled,
      fallbackAutoEnroll: programme.fallbackAutoEnroll,
      announcementsEnabled: programme.announcementsEnabled,
      items: programme.items.map((item) => {
        const position = positions.get(item.id);
        return {
          soundId: item.id,
          isFallback: position !== undefined,
          ...(position !== undefined ? { fallbackOrder: position } : {}),
        };
      }),
    });
    setRotationBusy(false);
    if (!result.ok) {
      setRotationMsg(result.error);
      return;
    }
    setProgramme(result.data);
    setRotationMsg('Rotation updated.');
  };

  const addRotationItem = async (item: ProgrammeItem) => {
    await saveEditableRotation([...editableRotation, item]);
  };

  const play = usePlayerStore((state) => state.play);
  const previewCurrentId = usePlayerStore((state) => state.currentId);
  const previewStatus = usePlayerStore((state) => state.status);
  const previewItemId = previewCurrentId?.startsWith('sound:')
    ? previewCurrentId.slice('sound:'.length)
    : null;
  const previewPlaying = previewStatus === 'playing';
  const rotationCurrentId = rotationPlaying
    ? (rotation?.item?.id ?? null)
    : previewItemId;
  const rotationEditorPlaying = rotationPlaying ? true : previewPlaying;

  const previewRotationItem = async (item: ProgrammeItem) => {
    const { data } = await fetchEditorSource(item.id);
    play({
      id: `sound:${item.id}`,
      kind: 'sound',
      title: item.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const handleEnd = async () => {
    setEnding(true);
    setError(null);
    const result = await postEndBroadcast();
    setEnding(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onEnded?.();
  };

  return {
    isPlaying,
    canControl,
    signal,
    stats,
    signalError,
    targets,
    rotation,
    rotationPaused,
    programme,
    ending,
    confirmEndOpen,
    setConfirmEndOpen,
    error,
    transportBusy,
    collections,
    selectedCollectionSlug,
    selectedCollection,
    playlistDialogOpen,
    setPlaylistDialogOpen,
    pendingApply,
    setPendingApply,
    playlistLoading,
    rotationBusy,
    rotationMsg,
    activeTab,
    setActiveTab,
    rotationExpanded,
    setRotationExpanded,
    overlayShowTitle,
    setOverlayShowTitle,
    overlayModalOpen,
    setOverlayModalOpen,
    signalConnected,
    liveActive,
    liveDurationSec,
    rotationPlaying,
    bitrate,
    listeners,
    outputLabel,
    playerState,
    durationSec,
    elapsedSinceObserved,
    editableRotation,
    availableRotationItems,
    selectedPlaylistHasRotationTracks,
    handleTransport,
    openPlaylistDialog,
    previewCollection,
    handleApplyCollectionToRotation,
    saveEditableRotation,
    addRotationItem,
    rotationCurrentId,
    rotationEditorPlaying,
    previewRotationItem,
    handleEnd,
  };
}

export type StreamManagerState = ReturnType<typeof useStreamManagerState>;
