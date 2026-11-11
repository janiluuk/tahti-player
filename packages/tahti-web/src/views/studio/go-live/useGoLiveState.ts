import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import {
  fetchAutoRecordEnabled,
  fetchBroadcastPreflight,
  fetchBroadcastUsage,
  fetchRtmpTargets,
  fetchSignalStatus,
  fetchStreamSettings,
  getMockChannelState,
  liveChannelPlayable,
  patchAutoRecordEnabled,
  postEndBroadcast,
  postGoLive,
  setMockLiveSlug,
  type BroadcastPreflight,
  type BroadcastUsage,
  type IngestStatus,
  type RtmpTarget,
  type SignalStatus,
  type StreamSettings,
} from '../../../api/broadcast';
import { usePolling } from '../../../hooks/usePolling';
import { useAuthStore } from '../../../stores/authStore';
import { useBroadcastPresenceStore } from '../../../stores/broadcastPresenceStore';
import { usePlayerStore } from '../../../stores/playerStore';

export type Ingest = 'obs' | 'icecast' | 'traktor';

/** A failure is announced right away (`role="alert"`); success waits its turn. */
export type GoLiveMessage = { tone: 'error' | 'success'; text: string };

/** Broadcast settings, live signal polling, go-live and recording actions. */
export function useGoLiveState() {
  const user = useAuthStore((state) => state.user);
  const refresh = useAuthStore((state) => state.refresh);
  const play = usePlayerStore((state) => state.play);
  const playbackStatus = usePlayerStore((state) => state.status);
  const currentId = usePlayerStore((state) => state.currentId);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);

  const [settings, setSettings] = useState<StreamSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [signal, setSignal] = useState<SignalStatus | null>(null);
  const [usage, setUsage] = useState<BroadcastUsage | null>(null);
  const [targets, setTargets] = useState<RtmpTarget[]>([]);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [channelState, setChannelState] = useState(
    user?.channel?.state ?? 'OFFLINE',
  );
  const [ingest, setIngest] = useState<Ingest>('obs');
  const [credentialsExpanded, setCredentialsExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<GoLiveMessage | null>(null);
  const [confirmGoLive, setConfirmGoLive] = useState(false);
  const [recordEnabled, setRecordEnabled] = useState(true);
  const [recordBusy, setRecordBusy] = useState(false);
  const [preflight, setPreflight] = useState<BroadcastPreflight | null>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [localLiveSince, setLocalLiveSince] = useState<string | null>(null);

  const slug = user?.channel?.slug ?? '';
  const displayName = user?.displayName ?? slug;
  const streamPlayableId = `live:${slug}`;
  const isMock = import.meta.env.VITE_FORCE_MOCK === '1';
  const ingestStatus: IngestStatus =
    signal?.ingest ??
    user?.channel?.ingest ??
    (signal?.connected ? 'connected' : 'disconnected');
  const reconnectDeadline =
    signal?.reconnectDeadline ?? user?.channel?.reconnectDeadline ?? null;
  const reconnecting =
    channelState === 'LIVE' && ingestStatus === 'reconnecting';
  const isBroadcastLive = channelState === 'LIVE' && Boolean(signal?.connected);
  const rotationPlaying =
    channelState === 'LIVE' && !signal?.connected && !reconnecting;
  const isPreview = channelState === 'PREVIEW';
  const signalOk = Boolean(signal?.connected) || isPreview;
  const liveSince = user?.channel?.goneLiveAt ?? localLiveSince;
  const isStreamPlaying =
    currentId === streamPlayableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const isPreviewListening =
    currentId === streamPlayableId && playbackStatus === 'playing';
  const showInfoReady = Boolean(preflight?.title?.trim());

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
    const [
      settingsResult,
      usageResult,
      targetResult,
      preflightResult,
      recordingResult,
    ] = await Promise.all([
      fetchStreamSettings(),
      fetchBroadcastUsage(),
      fetchRtmpTargets(),
      fetchBroadcastPreflight(),
      fetchAutoRecordEnabled(),
    ]);
    setSettings(settingsResult.data);
    setSettingsError(
      settingsResult.data
        ? null
        : (settingsResult.meta.reason ??
            i18n.t('web:goLiveStates.streamSettingsUnavailable')),
    );
    setUsage(usageResult.data);
    setTargets(targetResult.data);
    setTargetsError(
      targetResult.meta.source === 'api'
        ? (targetResult.meta.reason ?? null)
        : null,
    );
    setPreflight(preflightResult.data);
    setPreflightError(
      preflightResult.data
        ? null
        : (preflightResult.meta.reason ?? 'Show info is unavailable.'),
    );
    setLoaded(true);
    setRecordEnabled(recordingResult.data);
    if (
      !settingsResult.data &&
      settingsResult.meta.source === 'api' &&
      settingsResult.meta.reason
    ) {
      setMessage({
        tone: 'error',
        text: i18n.t('web:goLiveStates.streamSettingsError', {
          reason: settingsResult.meta.reason,
        }),
      });
    }
    if (isMock) {
      setChannelState(getMockChannelState());
    }
  }, [isMock]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (isBroadcastLive && !localLiveSince) {
      setLocalLiveSince(new Date().toISOString());
    }
    if (channelState !== 'LIVE' && localLiveSince) {
      setLocalLiveSince(null);
    }
  }, [isBroadcastLive, channelState, localLiveSince]);

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
    const channelSlug = user?.channel?.slug;
    if (channelSlug) {
      setMockLiveSlug(channelSlug);
    }
    let result: Awaited<ReturnType<typeof postGoLive>>;
    try {
      result = await postGoLive();
    } catch {
      toast.error(i18n.t('web:toasts.couldNotGoLive'));
      return;
    } finally {
      setBusy(false);
    }
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error });
      toast.error(result.error);
      return;
    }
    patchLocalChannel('LIVE');
    setMessage({
      tone: 'success',
      text: i18n.t('web:goLiveStates.liveHandover'),
    });
    toast.success(i18n.t('web:toasts.youreLive'));
    playStream();
    if (!isMock) {
      void refresh();
    }
  };

  const onEndBroadcast = async () => {
    setBusy(true);
    setMessage(null);
    const result = await postEndBroadcast();
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error });
      toast.error(result.error);
      return;
    }
    patchLocalChannel('OFFLINE');
    toast.success(i18n.t('web:goLivePage.toasts.ended'));
    void reload();
    if (!isMock) {
      void refresh();
    }
  };

  const toggleRecording = async () => {
    const next = !recordEnabled;
    setRecordEnabled(next);
    setRecordBusy(true);
    setMessage(null);
    const result = await patchAutoRecordEnabled(next);
    setRecordBusy(false);
    if (!result.ok) {
      setRecordEnabled(!next);
      toast.error(result.error);
      return;
    }
    toast.success(
      next
        ? i18n.t('web:goLiveStates.recordingEnabled')
        : i18n.t('web:goLiveStates.recordingDisabled'),
    );
  };

  const analyser = usePlayerStore((state) => state.analyser);

  return {
    user,
    analyser,
    settings,
    setSettings,
    settingsError,
    signal,
    setSignal,
    usage,
    targets,
    targetsError,
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
    setPreflight,
    preflightError,
    loaded,
    confirmEnd,
    setConfirmEnd,
    ingestStatus,
    reconnectDeadline,
    reconnecting,
    liveSince,
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
    onEndBroadcast,
    toggleRecording,
  };
}

export type GoLiveState = ReturnType<typeof useGoLiveState>;
