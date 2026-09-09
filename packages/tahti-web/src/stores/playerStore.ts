import { toast } from 'sonner';
import { create } from 'zustand';

import type { QueueItem, RepeatMode } from '@tahti-player/model';

import type { TahtiPlayable } from '../api/types';
import { playableToTrack } from '../lib/playableToTrack';
import { useLayoutStore } from './layoutStore';
import { useLibraryStore } from './libraryStore';

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error';

type PlayerState = {
  queue: QueueItem[];
  currentId: string | null;
  status: PlaybackStatus;
  error: string | null;
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  isLive: boolean;
  /** True only for an actual live human broadcast right now, not a 24/7
   * fallback rotation sharing the same `kind`/channel state -- drives the
   * LIVE badge specifically. `isLive` above still governs live-style
   * playback UI (no seekbar, shuffle disabled) for both cases. */
  isRealLive: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  /** True after the user has started playback at least once this session. */
  hasPlayed: boolean;
  /** Last radio/live station played — resumed automatically once a track detour finishes with nothing else queued. */
  lastRadioPlayable: TahtiPlayable | null;
  /** Whether the bottom player bar is shown; set true on play, false via hide. */
  playerBarVisible: boolean;
  /** Set by UI; AudioEngine applies to the media element then clears. */
  seekTarget: number | null;
  /** Shared Web Audio analyser for channel visualizers (set by AudioEngine). */
  analyser: AnalyserNode | null;
  setAnalyser: (analyser: AnalyserNode | null) => void;
  play: (item: TahtiPlayable, opts?: { enqueueRest?: TahtiPlayable[] }) => void;
  enqueue: (item: TahtiPlayable) => void;
  /** Insert right after the current track, replacing any earlier occurrence. */
  playNext: (item: TahtiPlayable) => void;
  playQueueIndex: (id: string) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  /** One-shot reshuffle of queue order (distinct from `shuffle`, the
   * persistent next-track-selection mode) — keeps the current track in
   * place, randomizes everything after it. */
  shuffleQueueOrder: () => void;
  hidePlayerBar: () => void;
  setStatus: (status: PlaybackStatus, error?: string | null) => void;
  setProgress: (currentTime: number, duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  /** Seek VOD/archive to absolute seconds (no-op while live/radio). */
  seekTo: (seconds: number) => void;
  clearSeekTarget: () => void;
  next: () => void;
  previous: () => void;
};

function toTrack(item: TahtiPlayable) {
  return playableToTrack(item);
}

function recordHistory(item: TahtiPlayable) {
  useLibraryStore.getState().pushHistory(item);
}

function toQueueItem(item: TahtiPlayable): QueueItem {
  return {
    id: item.id,
    track: toTrack(item),
    status: 'idle',
    addedAtIso: new Date().toISOString(),
  };
}

function streamUrlFromQueueItem(qi: QueueItem): string | null {
  return (
    qi.track.streamCandidates?.[0]?.stream?.url ?? qi.track.source.url ?? null
  );
}

export function playableFromQueueItem(qi: QueueItem): TahtiPlayable | null {
  const url = streamUrlFromQueueItem(qi);
  const provider = qi.track.source.provider;
  if (!url && provider !== 'hearthis') {
    return null;
  }
  const protocol = url
    ? qi.track.streamCandidates?.[0]?.stream?.protocol === 'hls'
      ? 'hls'
      : 'https'
    : 'https';
  const embed =
    provider === 'hearthis' && !url
      ? { provider: 'hearthis' as const, embedUri: qi.track.source.id }
      : undefined;
  return {
    id: qi.id,
    kind: qi.id.startsWith('radio:')
      ? 'radio'
      : qi.id.startsWith('sound:')
        ? 'sound'
        : 'live',
    title: qi.track.title,
    artist: qi.track.artists.map((a) => a.name).join(', '),
    coverUrl: qi.track.artwork?.items[0]?.url,
    streamUrl: url ?? '',
    protocol,
    embed,
    sourceProvider: provider,
    channelSlug: qi.id.includes(':') ? qi.id.split(':')[1] : undefined,
  };
}

const REPEAT_CYCLE: RepeatMode[] = ['off', 'all', 'one'];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentId: null,
  status: 'idle',
  error: null,
  volume: 0.85,
  muted: false,
  currentTime: 0,
  duration: 0,
  isLive: true,
  isRealLive: false,
  shuffle: false,
  repeatMode: 'off',
  hasPlayed: false,
  lastRadioPlayable: null,
  playerBarVisible: true,
  seekTarget: null,
  analyser: null,

  setAnalyser: (analyser) => set({ analyser }),

  play: (item, opts) => {
    const head = toQueueItem(item);
    const rest = (opts?.enqueueRest ?? []).map(toQueueItem);
    const queue = [head, ...rest.filter((r) => r.id !== head.id)];
    const isRadioOrLive = item.kind === 'live' || item.kind === 'radio';
    recordHistory(item);
    set({
      queue,
      currentId: head.id,
      status: item.embed ? 'playing' : 'loading',
      error: null,
      currentTime: 0,
      duration: 0,
      seekTarget: null,
      isLive: isRadioOrLive,
      isRealLive: isRadioOrLive && Boolean(item.isRealLive),
      hasPlayed: true,
      lastRadioPlayable: isRadioOrLive ? item : get().lastRadioPlayable,
      playerBarVisible: true,
    });
  },

  enqueue: (item) => {
    const qi = toQueueItem(item);
    const wasBarVisible = get().playerBarVisible;
    const alreadyQueued = get().queue.some((q) => q.id === qi.id);
    set((s) => {
      if (s.queue.some((q) => q.id === qi.id)) {
        return s;
      }
      return { queue: [...s.queue, qi], playerBarVisible: true };
    });
    if (alreadyQueued) {
      return;
    }
    // The player bar auto-shows itself above, but its queue strip is a
    // separately toggled section (layoutStore.bottomQueueOpen) that does
    // NOT auto-open -- without a toast, adding to queue while it's
    // collapsed (or the bar itself was hidden) gives no feedback at all.
    if (!wasBarVisible || !useLayoutStore.getState().bottomQueueOpen) {
      toast(`Added "${item.title}" to queue`);
    }
  },

  playNext: (item) => {
    const qi = toQueueItem(item);
    set((s) => {
      const withoutExisting = s.queue.filter((q) => q.id !== qi.id);
      const currentIdx = s.currentId
        ? withoutExisting.findIndex((q) => q.id === s.currentId)
        : -1;
      const insertAt = currentIdx + 1;
      const queue = [
        ...withoutExisting.slice(0, insertAt),
        qi,
        ...withoutExisting.slice(insertAt),
      ];
      return { queue, playerBarVisible: true };
    });
  },

  playQueueIndex: (id) => {
    const qi = get().queue.find((q) => q.id === id);
    if (!qi) {
      return;
    }
    const playable = playableFromQueueItem(qi);
    if (playable) {
      recordHistory(playable);
    }
    const isRadioOrLive =
      playable?.kind === 'live' || playable?.kind === 'radio';
    set({
      currentId: id,
      status: playable?.embed ? 'playing' : 'loading',
      error: null,
      currentTime: 0,
      seekTarget: null,
      isLive: isRadioOrLive,
      // playableFromQueueItem rebuilds a TahtiPlayable from the queued
      // Track, which never carried isRealLive through -- conservatively
      // false here rather than guessing, so a rotation never falsely
      // reads as LIVE. Only play() (the normal way to start a live
      // channel) has the real signal.
      isRealLive: false,
      hasPlayed: true,
      lastRadioPlayable:
        isRadioOrLive && playable ? playable : get().lastRadioPlayable,
      playerBarVisible: true,
    });
  },

  removeFromQueue: (id) => {
    set((s) => {
      const queue = s.queue.filter((q) => q.id !== id);
      const currentId =
        s.currentId === id ? (queue[0]?.id ?? null) : s.currentId;
      return {
        queue,
        currentId,
        status: currentId ? s.status : 'idle',
      };
    });
  },

  clearQueue: () =>
    set({
      queue: [],
      currentId: null,
      status: 'idle',
      error: null,
      currentTime: 0,
      duration: 0,
    }),

  reorderQueue: (fromIndex, toIndex) => {
    set((s) => {
      if (
        fromIndex < 0 ||
        fromIndex >= s.queue.length ||
        toIndex < 0 ||
        toIndex >= s.queue.length ||
        fromIndex === toIndex
      ) {
        return s;
      }
      const queue = [...s.queue];
      const [moved] = queue.splice(fromIndex, 1);
      if (!moved) {
        return s;
      }
      queue.splice(toIndex, 0, moved);
      return { queue };
    });
  },

  shuffleQueueOrder: () => {
    set((s) => {
      const currentIndex = s.currentId
        ? s.queue.findIndex((q) => q.id === s.currentId)
        : -1;
      const head = currentIndex >= 0 ? [s.queue[currentIndex]!] : [];
      const rest = s.queue.filter((_, i) => i !== currentIndex);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j]!, rest[i]!];
      }
      return { queue: [...head, ...rest] };
    });
  },

  hidePlayerBar: () => set({ playerBarVisible: false }),

  setStatus: (status, error = null) => set({ status, error }),

  setProgress: (currentTime, duration) => set({ currentTime, duration }),

  setVolume: (volume) => set({ volume, muted: volume === 0 ? true : false }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),

  toggleShuffle: () => {
    const { isLive } = get();
    if (isLive) {
      return;
    }
    set((s) => ({ shuffle: !s.shuffle }));
  },

  cycleRepeat: () => {
    const { isLive, repeatMode } = get();
    if (isLive) {
      return;
    }
    const idx = REPEAT_CYCLE.indexOf(repeatMode);
    set({ repeatMode: REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length]! });
  },

  seekTo: (seconds) => {
    const { isLive, duration } = get();
    if (isLive) {
      return;
    }
    const max = duration > 0 ? duration : seconds;
    const clamped = Math.max(0, Math.min(max, seconds));
    set({ seekTarget: clamped, currentTime: clamped });
  },

  clearSeekTarget: () => set({ seekTarget: null }),

  next: () => {
    const { queue, currentId, shuffle, repeatMode, isLive, lastRadioPlayable } =
      get();
    if (!currentId || queue.length === 0) {
      return;
    }

    if (repeatMode === 'one' && !isLive) {
      get().playQueueIndex(currentId);
      return;
    }

    const idx = queue.findIndex((q) => q.id === currentId);

    if (shuffle && !isLive && queue.length > 1) {
      const others = queue.filter((q) => q.id !== currentId);
      const pick = others[Math.floor(Math.random() * others.length)];
      if (pick) {
        get().playQueueIndex(pick.id);
      }
      return;
    }

    const nextItem = queue[idx + 1];
    if (nextItem) {
      get().playQueueIndex(nextItem.id);
      return;
    }
    if (repeatMode === 'all' && !isLive && queue[0]) {
      get().playQueueIndex(queue[0].id);
      return;
    }
    // Nothing left queued — if a track detour interrupted radio, resume it.
    if (!isLive && lastRadioPlayable) {
      get().play(lastRadioPlayable);
    }
  },

  previous: () => {
    const { queue, currentId, currentTime, isLive } = get();
    if (!currentId || queue.length === 0) {
      return;
    }
    // Restart current VOD if >3s in (Nuclear-style), else go previous
    if (!isLive && currentTime > 3) {
      get().seekTo(0);
      return;
    }
    const idx = queue.findIndex((q) => q.id === currentId);
    const prev = queue[idx - 1];
    if (prev) {
      get().playQueueIndex(prev.id);
    }
  },
}));
