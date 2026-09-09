import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

import { postListenEvent } from '../api/client';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';

const LISTEN_EVENT_AFTER_SEC = 15;

/**
 * Mounts a hidden <audio> element driven by the player store.
 * Live / radio: HLS via hls.js (or native Safari).
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const listenReportedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const currentId = usePlayerStore((s) => s.currentId);
  const queue = usePlayerStore((s) => s.queue);
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const clearSeekTarget = usePlayerStore((s) => s.clearSeekTarget);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const setAnalyser = usePlayerStore((s) => s.setAnalyser);

  const current = queue.find((q) => q.id === currentId) ?? null;
  const playable = current ? playableFromQueueItem(current) : null;

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
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [setStatus, previous, next]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }
    if (!playable) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: playable.title,
      artist: playable.artist,
      artwork: playable.coverUrl
        ? [{ src: playable.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }, [playable]);

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
      setProgress(
        audio.currentTime,
        Number.isFinite(audio.duration) ? audio.duration : 0,
      );
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

    audio.crossOrigin = 'anonymous';
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('error', onError);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ liveDurationInfinity: true, enableWorker: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setStatus('error', data.details);
        }
      });
      hls.loadSource(url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void audio.play().catch(() => setStatus('paused'));
      });
    } else if (isHls && audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = url;
      void audio.play().catch(() => setStatus('paused'));
    } else {
      audio.src = url;
      void audio.play().catch(() => setStatus('paused'));
    }

    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('error', onError);
      cleanup();
    };
  }, [playable?.id, playable?.streamUrl]);

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

  // Best-effort listen analytics once an archive item has played long enough.
  useEffect(() => {
    if (!playable || playable.kind !== 'sound') {
      return;
    }
    if (currentTime < LISTEN_EVENT_AFTER_SEC) {
      return;
    }
    if (!playable.id.startsWith('sound:')) {
      return;
    }
    const soundId = playable.id.slice('sound:'.length);
    if (!soundId || listenReportedRef.current.has(soundId)) {
      return;
    }
    listenReportedRef.current.add(soundId);
    void postListenEvent(soundId);
  }, [playable, currentTime]);

  return <audio ref={audioRef} preload="none" className="hidden" />;
}
