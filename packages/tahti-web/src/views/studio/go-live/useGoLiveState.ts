import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchBroadcastPreflight,
  fetchBroadcastUsage,
  fetchRtmpTargets,
  fetchSignalStatus,
  fetchStreamSettings,
  getMockChannelState,
  liveChannelPlayable,
  patchBroadcastPreflight,
  postGoLive,
  type BroadcastPreflight,
  type BroadcastUsage,
  type RtmpTarget,
  type SignalStatus,
  type StreamSettings,
} from '../../../api/broadcast';
import { usePolling } from '../../../hooks/usePolling';
import { useAuthStore } from '../../../stores/authStore';
import { useBroadcastPresenceStore } from '../../../stores/broadcastPresenceStore';
import { usePlayerStore } from '../../../stores/playerStore';

export type Ingest = 'obs' | 'icecast' | 'traktor';

/** Broadcast settings, live signal polling, go-live and recording actions. */
export function useGoLiveState() {
  const user = useAuthStore((state) => state.user);
  const refresh = useAuthStore((state) => state.refresh);
  const play = usePlayerStore((state) => state.play);
  const playbackStatus = usePlayerStore((state) => state.status);
  const currentId = usePlayerStore((state) => state.currentId);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);

  const [settings, setSettings] = useState<StreamSettings | null>(null);
  const [signal, setSignal] = useState<SignalStatus | null>(null);
  const [usage, setUsage] = useState<BroadcastUsage | null>(null);
  const [targets, setTargets] = useState<RtmpTarget[]>([]);
  const [channelState, setChannelState] = useState(
    user?.channel?.state ?? 'OFFLINE',
  );
  const [ingest, setIngest] = useState<Ingest>('obs');
  const [credentialsExpanded, setCredentialsExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmGoLive, setConfirmGoLive] = useState(false);
  const [recordEnabled, setRecordEnabled] = useState(true);
  const [recordBusy, setRecordBusy] = useState(false);
  const [preflight, setPreflight] = useState<BroadcastPreflight | null>(null);
  const [showInfoConfirmed, setShowInfoConfirmed] = useState(false);
  const [showInfoModalOpen, setShowInfoModalOpen] = useState(false);

  const slug = user?.channel?.slug ?? '';
  const displayName = user?.displayName ?? slug;
  const streamPlayableId = `live:${slug}`;
  const isMock = import.meta.env.VITE_FORCE_MOCK === '1';
  const isBroadcastLive = channelState === 'LIVE' && Boolean(signal?.connected);
  const rotationPlaying = channelState === 'LIVE' && !signal?.connected;
  const isPreview = channelState === 'PREVIEW';
  const signalOk = Boolean(signal?.connected) || isPreview;
  const isStreamPlaying =
    currentId === streamPlayableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const isPreviewListening =
    currentId === streamPlayableId && playbackStatus === 'playing';
  const showInfoReady = showInfoConfirmed || Boolean(preflight?.title?.trim());

  const patchLocalChannel = useCallback((state: string) => {
    setChannelState(state);
    useAuthStore.setState((current) => {
      if (!current.user?.channel) {
        return current;
      }
      return {
        user: {
          ...current.user,
          channel: { ...current.user.channel, state },
        },
      };
    });
  }, []);

  const reload = useCallback(async () => {
    const [settingsResult, usageResult, targetResult, preflightResult] =
      await Promise.all([
        fetchStreamSettings(),
        fetchBroadcastUsage(),
        fetchRtmpTargets(),
        fetchBroadcastPreflight(),
      ]);
    setSettings(settingsResult.data);
    setUsage(usageResult.data);
    setTargets(targetResult.data);
    setPreflight(preflightResult.data);
    setRecordEnabled(preflightResult.data?.autoPublish ?? true);
    if (
      !settingsResult.data &&
      settingsResult.meta.source === 'api' &&
      settingsResult.meta.reason
    ) {
      setMessage(
        `Stream settings: ${settingsResult.meta.reason} — log in as an artist with a channel.`,
      );
    }
    if (isMock) {
      setChannelState(getMockChannelState());
    }
  }, [isMock]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (user?.channel?.state && !isMock) {
      setChannelState(user.channel.state);
    }
  }, [user?.channel?.state, isMock]);

  const pollSignal = useCallback(async () => {
    const { data } = await fetchSignalStatus();
    setSignal(data);
    useBroadcastPresenceStore
      .getState()
      .setSignalConnected(Boolean(data.connected));
    if (!isMock) {
      await refresh();
    } else {
      setChannelState(getMockChannelState());
    }
  }, [refresh, isMock]);

  useEffect(() => {
    void pollSignal();
  }, [pollSignal]);
  usePolling(() => {
    void pollSignal();
  }, 4000);

  const playStream = () => {
    if (!settings || !slug) {
      return;
    }
    play(liveChannelPlayable(slug, displayName, settings.hlsUrl));
  };

  const toggleStreamPlayback = () => {
    if (currentId !== streamPlayableId) {
      playStream();
      return;
    }
    setPlaybackStatus(isStreamPlaying ? 'paused' : 'playing');
  };

  const onGoLive = async () => {
    setBusy(true);
    setMessage(null);
    let result: Awaited<ReturnType<typeof postGoLive>>;
    try {
      result = await postGoLive();
    } catch {
      toast.error('Could not go live.');
      return;
    } finally {
      setBusy(false);
    }
    if (!result.ok) {
      setMessage(result.error);
      toast.error(result.error);
      return;
    }
    patchLocalChannel('LIVE');
    setMessage('You’re live. The rotation has handed over to your broadcast.');
    toast.success('You’re live.');
    playStream();
    if (!isMock) {
      void refresh();
    }
  };

  const toggleRecording = async () => {
    const next = !recordEnabled;
    setRecordEnabled(next);
    setRecordBusy(true);
    setMessage(null);
    const result = await patchBroadcastPreflight({ autoPublish: next });
    setRecordBusy(false);
    if ('error' in result) {
      setRecordEnabled(!next);
      toast.error(result.error);
      return;
    }
    toast.success(next ? 'Recording enabled.' : 'Recording disabled.');
  };

  const analyser = usePlayerStore((state) => state.analyser);

  return {
    user,
    analyser,
    settings,
    signal,
    setSignal,
    usage,
    targets,
    channelState,
    setChannelState,
    ingest,
    setIngest,
    credentialsExpanded,
    setCredentialsExpanded,
    busy,
    message,
    confirmGoLive,
    setConfirmGoLive,
    recordEnabled,
    recordBusy,
    preflight,
    showInfoConfirmed,
    setShowInfoConfirmed,
    showInfoModalOpen,
    setShowInfoModalOpen,
    slug,
    displayName,
    streamPlayableId,
    isMock,
    isBroadcastLive,
    rotationPlaying,
    isPreview,
    signalOk,
    isStreamPlaying,
    isPreviewListening,
    showInfoReady,
    reload,
    playStream,
    toggleStreamPlayback,
    onGoLive,
    toggleRecording,
  };
}

export type GoLiveState = ReturnType<typeof useGoLiveState>;
