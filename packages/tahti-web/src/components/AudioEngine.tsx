import type Hls from 'hls.js';
import { useEffect, useMemo, useRef } from 'react';

import type { QueueItem } from '@tahti-player/model';

import { postListenEvent } from '../api/client';
import type { TahtiPlayable } from '../api/types';
import { mediaSessionArtwork } from '../lib/mediaSessionArtwork';
import { usePlaybackPrefsStore } from '../stores/playbackPrefsStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';

const LISTEN_EVENT_AFTER_SEC = 15;

let hlsModule: Promise<typeof import('hls.js')> | null = null;

/** hls.js is most of a megabyte, so it loads on the first HLS stream
 * instead of with the app shell. */
function loadHls(): Promise<typeof import('hls.js')> {
  hlsModule ??= import('hls.js').catch((error: unknown) => {
    hlsModule = null;
    throw error;
  });
  return hlsModule;
}

/**
 * Mounts a hidden <audio> element driven by the player store.
 * Live / radio: HLS via hls.js (or native Safari).
 */
/**
 * WebKit AirPlays a media element's own output. Once `createMediaElementSource`
 * captures the element, its sound only leaves through the AudioContext, so the
 * AirPlay receiver plays silence, and a capture can't be undone. Browsers that
 * can AirPlay therefore play uncaptured (visualizers fall back to idle).
 */
function canAirPlay(): boolean {
  return (
    typeof window !== 'undefined' &&
    'WebKitPlaybackTargetAvailabilityEvent' in window
  );
}

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const listenReportedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const current = usePlayerStore(selectCurrentItem);
  const restoredPending = usePlayerStore((s) => s.restoredPending);
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const clearSeekTarget = usePlayerStore((s) => s.clearSeekTarget);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const seekBy = usePlayerStore((s) => s.seekBy);
  const skipSeconds = usePlaybackPrefsStore((s) => s.skipSeconds);
  const setAnalyser = usePlayerStore((s) => s.setAnalyser);

  const playable = useMemo(
    () => (current ? playableFromQueueItem(current) : null),
    [current],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // OS-level media controls (lock screen, notification, headset/keyboard
  // media keys) — matches Nuclear desktop's official MediaSession plugin,
  // which had no equivalent here at all before this.
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }
    navigator.mediaSession.setActionHandler('play', () => setStatus('playing'));
    navigator.mediaSession.setActionHandler('pause', () => setStatus('paused'));
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekforward', (details) =>
      seekBy(details.seekOffset ?? skipSeconds),
    );
    navigator.mediaSession.setActionHandler('seekbackward', (details) =>
      seekBy(-(details.seekOffset ?? skipSeconds)),
    );
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
    };
  }, [setStatus, previous, next, seekBy, skipSeconds]);

  const hasPlayable = playable != null;
  const metaTitle = playable?.title;
  const metaArtist = playable?.artist;
  const metaArtworkJson = useMemo(
    () =>
      JSON.stringify(mediaSessionArtwork(current?.track.artwork?.items ?? [])),
    [current],
  );
  // Keyed on primitives, not the playable object: queue rebuilds (re-play,
  // resolved stream URLs) hand back a new object for the same track, and
  // each MediaMetadata assignment makes the OS refetch artwork.
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }
    if (!hasPlayable) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metaTitle,
      artist: metaArtist,
      artwork: JSON.parse(metaArtworkJson) as MediaImage[],
    });
  }, [hasPlayable, metaTitle, metaArtist, metaArtworkJson]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }
    navigator.mediaSession.playbackState =
      status === 'playing'
        ? 'playing'
        : status === 'paused'
          ? 'paused'
          : 'none';
  }, [status]);

  // Shared AnalyserNode for channel WebGL / bar visualizers.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const ensureGraph = () => {
      if (canAirPlay()) {
        return;
      }
      try {
        if (!audioCtxRef.current) {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext;
          if (!Ctx) {
            return;
          }
          audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          void ctx.resume().catch(() => undefined);
        }
        if (!sourceRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audio);
        }
        if (!analyserRef.current) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.75;
          sourceRef.current.connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
          setAnalyser(analyser);
        }
      } catch {
        // createMediaElementSource can only run once per element — ignore races.
      }
    };
    const onPlay = () => ensureGraph();
    audio.addEventListener('play', onPlay);
    if (!audio.paused) {
      ensureGraph();
    }
    return () => {
      audio.removeEventListener('play', onPlay);
    };
  }, [setAnalyser]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playable || playable.embed) {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (audio && playable?.embed) {
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }

    // A track restored from the last session stays unloaded until the user
    // presses play (which clears restoredPending) -- no audio on launch.
    if (
      restoredPending === playable.id &&
      usePlayerStore.getState().status === 'paused'
    ) {
      return;
    }

    const url = playable.streamUrl;
    const isHls = playable.protocol === 'hls' || url.includes('.m3u8');

    const cleanup = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      audio.removeAttribute('src');
      audio.load();
    };

    cleanup();
    setStatus('loading');

    const onPlaying = () => setStatus('playing');
    const onPause = () => {
      if (!audio.ended) {
        setStatus('paused');
      }
    };
    const onEnded = () => {
      if (playable.kind === 'live' || playable.kind === 'radio') {
        return;
      }
      next();
    };
    let lastProgressUpdate = 0;
    const PROGRESS_THROTTLE_MS = 1000;
    const onTime = () => {
      const now = performance.now();
      if (now - lastProgressUpdate < PROGRESS_THROTTLE_MS) {
        return;
      }
      lastProgressUpdate = now;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setProgress(audio.currentTime, duration);
      updatePositionState(audio.currentTime, duration, audio.playbackRate);
    };
    const onSeeked = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      updatePositionState(audio.currentTime, duration, audio.playbackRate);
    };
    // crossOrigin is required for the shared analyser (see the graph
    // effect above) -- without it, connecting a MediaElementAudioSourceNode
    // to a cross-origin stream still plays audio fine but the analyser
    // reads back all-zero frequency data, so every visualizer looks dead
    // even though sound is coming out. If the stream host doesn't
    // actually serve CORS headers, forcing crossOrigin instead makes the
    // browser refuse to load it -- fall back to a plain, non-CORS load
    // so playback still works (that one source just won't visualize).
    let triedFallback = false;
    const onError = () => {
      if (audio.crossOrigin && !triedFallback) {
        triedFallback = true;
        audio.crossOrigin = null;
        if (isHls && hlsRef.current) {
          hlsRef.current.loadSource(url);
        } else {
          audio.src = url;
          void audio.play().catch(() => setStatus('paused'));
        }
        return;
      }
      setStatus('error', 'Playback error');
    };

    audio.crossOrigin = canAirPlay() ? null : 'anonymous';
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('error', onError);

    const playDirect = () => {
      audio.src = url;
      void audio.play().catch(() => setStatus('paused'));
    };
    let disposed = false;

    // AirPlay can't cast a MediaSource-backed element, so prefer native HLS there.
    if (
      !isHls ||
      (canAirPlay() &&
        audio.canPlayType('application/vnd.apple.mpegurl') !== '')
    ) {
      playDirect();
    } else {
      void loadHls()
        .then(({ default: HlsPlayer }) => {
          if (disposed) {
            return;
          }
          if (!HlsPlayer.isSupported()) {
            playDirect();
            return;
          }
          const hls = new HlsPlayer({
            liveDurationInfinity: true,
            enableWorker: true,
          });
          hlsRef.current = hls;
          hls.on(HlsPlayer.Events.ERROR, (_e, data) => {
            if (data.fatal) {
              setStatus('error', data.details);
            }
          });
          hls.loadSource(url);
          hls.attachMedia(audio);
          hls.on(HlsPlayer.Events.MANIFEST_PARSED, () => {
            void audio.play().catch(() => setStatus('paused'));
          });
        })
        .catch(() => {
          if (!disposed) {
            setStatus('error', 'Could not load the stream player');
          }
        });
    }

    return () => {
      disposed = true;
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('error', onError);
      cleanup();
    };
  }, [playable?.id, playable?.streamUrl, restoredPending]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (status === 'playing' && audio.paused) {
      void audio.play().catch(() => undefined);
    }
    if (status === 'paused' && !audio.paused) {
      audio.pause();
    }
  }, [status]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTarget == null) {
      return;
    }
    try {
      audio.currentTime = seekTarget;
    } catch {
      // Some live HLS sources reject seeks — ignore.
    }
    clearSeekTarget();
  }, [seekTarget, clearSeekTarget]);

  return (
    <>
      <audio ref={audioRef} preload="none" className="hidden" />
      <ListenEventReporter
        soundId={listenSoundId(playable)}
        reported={listenReportedRef}
      />
    </>
  );
}

function selectCurrentItem(
  s: ReturnType<typeof usePlayerStore.getState>,
): QueueItem | null {
  return s.queue.find((item) => item.id === s.currentId) ?? null;
}

function listenSoundId(playable: TahtiPlayable | null): string | null {
  if (!playable || playable.kind !== 'sound') {
    return null;
  }
  if (!playable.id.startsWith('sound:')) {
    return null;
  }
  return playable.id.slice('sound:'.length) || null;
}

function updatePositionState(
  position: number,
  duration: number,
  playbackRate: number,
) {
  if (
    !('mediaSession' in navigator) ||
    typeof navigator.mediaSession.setPositionState !== 'function'
  ) {
    return;
  }
  // Live/radio streams report no finite duration; the API throws unless
  // 0 <= position <= duration and duration > 0.
  if (!(duration > 0) || position < 0 || position > duration) {
    return;
  }
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position,
      playbackRate: playbackRate > 0 ? playbackRate : 1,
    });
  } catch {
    // Some browsers reject edge values despite the guard above.
  }
}

/**
 * Subscribes to elapsed time on its own so progress ticks re-render only
 * this null component, never AudioEngine's metadata/playback effects.
 */
function ListenEventReporter({
  soundId,
  reported,
}: {
  soundId: string | null;
  reported: { current: Set<string> };
}) {
  const pastThreshold = usePlayerStore(
    (state) => state.currentTime >= LISTEN_EVENT_AFTER_SEC,
  );

  useEffect(() => {
    if (!soundId || !pastThreshold || reported.current.has(soundId)) {
      return;
    }
    reported.current.add(soundId);
    void postListenEvent(soundId);
  }, [soundId, pastThreshold, reported]);

  return null;
}
