import type { RepeatMode } from '@tahti-player/model';

import { usePlayerStore } from '../../stores/playerStore';
import { McpUserError, type DomainDef } from './types';

const REPEAT_MODES: readonly RepeatMode[] = ['off', 'all', 'one'];

function current() {
  const { queue, currentId } = usePlayerStore.getState();
  return queue.find((item) => item.id === currentId) ?? null;
}

function requireCurrent() {
  if (!current()) {
    throw new McpUserError('Nothing is loaded. Play something first.');
  }
}

export function playbackState() {
  const state = usePlayerStore.getState();
  const item = current();
  return {
    status: state.status,
    error: state.error,
    current: item
      ? {
          id: item.id,
          title: item.track.title,
          artist: item.track.artists.map((artist) => artist.name).join(', '),
        }
      : null,
    positionSec: Math.round(state.currentTime),
    durationSec: Math.round(state.duration),
    isLive: state.isLive,
    volume: state.volume,
    muted: state.muted,
    shuffle: state.shuffle,
    repeatMode: state.repeatMode,
  };
}

export const playbackDomain: DomainDef = {
  description:
    'What is playing and the transport: play, pause, skip, seek, volume, shuffle and repeat.',
  methods: {
    getState: {
      description:
        'What is playing now, where it is, and the volume, shuffle and repeat settings.',
      params: [],
      returns: 'PlaybackState',
      run: playbackState,
    },
    play: {
      description: 'Resume the loaded item.',
      params: [],
      returns: 'PlaybackState',
      run: () => {
        requireCurrent();
        usePlayerStore.getState().setStatus('playing');
        return playbackState();
      },
    },
    pause: {
      description: 'Pause playback.',
      params: [],
      returns: 'PlaybackState',
      run: () => {
        requireCurrent();
        usePlayerStore.getState().setStatus('paused');
        return playbackState();
      },
    },
    toggle: {
      description: 'Pause if playing, otherwise resume.',
      params: [],
      returns: 'PlaybackState',
      run: () => {
        requireCurrent();
        const { status, setStatus } = usePlayerStore.getState();
        setStatus(
          status === 'playing' || status === 'loading' ? 'paused' : 'playing',
        );
        return playbackState();
      },
    },
    next: {
      description: 'Skip to the next queue item.',
      params: [],
      returns: 'PlaybackState',
      run: () => {
        usePlayerStore.getState().next();
        return playbackState();
      },
    },
    previous: {
      description: 'Go back to the previous queue item.',
      params: [],
      returns: 'PlaybackState',
      run: () => {
        usePlayerStore.getState().previous();
        return playbackState();
      },
    },
    seekTo: {
      description:
        'Jump to a position in the current track. Live streams and radio cannot seek.',
      params: [
        {
          name: 'seconds',
          type: 'number',
          description: 'Position from the start, in seconds.',
        },
      ],
      returns: 'PlaybackState',
      run: ({ seconds }) => {
        requireCurrent();
        if (usePlayerStore.getState().isLive) {
          throw new McpUserError('A live stream or radio station cannot seek.');
        }
        usePlayerStore.getState().seekTo(Math.max(0, seconds as number));
        return playbackState();
      },
    },
    setVolume: {
      description: 'Set the volume.',
      params: [
        {
          name: 'volume',
          type: 'number',
          description: 'From 0 (silent) to 1 (full).',
        },
      ],
      returns: 'PlaybackState',
      run: ({ volume }) => {
        usePlayerStore
          .getState()
          .setVolume(Math.min(1, Math.max(0, volume as number)));
        return playbackState();
      },
    },
    setMuted: {
      description: 'Mute or unmute.',
      params: [
        { name: 'muted', type: 'boolean', description: 'true to mute.' },
      ],
      returns: 'PlaybackState',
      run: ({ muted }) => {
        const state = usePlayerStore.getState();
        if (state.muted !== muted) {
          state.toggleMute();
        }
        return playbackState();
      },
    },
    setShuffle: {
      description: 'Turn shuffle on or off. Live streams and radio ignore it.',
      params: [
        { name: 'enabled', type: 'boolean', description: 'true to shuffle.' },
      ],
      returns: 'PlaybackState',
      run: ({ enabled }) => {
        const state = usePlayerStore.getState();
        if (state.shuffle !== enabled) {
          state.toggleShuffle();
        }
        return playbackState();
      },
    },
    setRepeatMode: {
      description: 'Repeat nothing, the whole queue, or the current track.',
      params: [
        {
          name: 'mode',
          type: 'string',
          description: 'off, all or one.',
          oneOf: REPEAT_MODES,
        },
      ],
      returns: 'PlaybackState',
      run: ({ mode }) => {
        usePlayerStore.getState().setRepeatMode(mode as RepeatMode);
        return playbackState();
      },
    },
  },
};
