import { toast } from 'sonner';

import { usePlayerStore } from '../../stores/playerStore';
import { createDesktopServiceStore } from '../desktopService';
import { albumTitle } from '../playableToTrack';

/** What Discord shows under "Listening to". */
export type DiscordPresence = {
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  startTimestamp: number | null;
  endTimestamp: number | null;
};

/** What the desktop entry (`packages/player/src/main.tsx`) provides to talk to the Discord app. */
export type TahtiNativeDiscord = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  /** Resolves `true` when it had to reconnect first. */
  setActivity: (presence: DiscordPresence) => Promise<boolean>;
  clearActivity: () => Promise<void>;
};

declare global {
  var __TAHTI_NATIVE_DISCORD__: TahtiNativeDiscord | undefined;
}

export function getNativeDiscord(): TahtiNativeDiscord | null {
  return globalThis.__TAHTI_NATIVE_DISCORD__ ?? null;
}

export const useDesktopDiscordStore = createDesktopServiceStore({
  key: 'tahti-desktop-discord-enabled',
  native: getNativeDiscord,
  describe: () => null,
});

const HEARTBEAT_MS = 30_000;

/** The presence for what is playing, or `null` when Discord should show nothing. */
export function currentPresence(now = Date.now()): DiscordPresence | null {
  const { queue, currentId, status, currentTime, duration, isLive } =
    usePlayerStore.getState();
  const item = queue.find((entry) => entry.id === currentId);
  if (!item || (status !== 'playing' && status !== 'paused')) {
    return null;
  }
  const { track } = item;
  const artwork = track.artwork?.items[0]?.url;
  const nowSec = Math.floor(now / 1000);
  const playing = status === 'playing';
  return {
    title: track.title,
    artist: track.artists.map((artist) => artist.name).join(', '),
    album: albumTitle(track),
    artworkUrl: artwork && /^https?:\/\//.test(artwork) ? artwork : null,
    startTimestamp: playing ? nowSec - Math.floor(currentTime) : null,
    endTimestamp:
      playing && !isLive && duration > 0
        ? nowSec + Math.floor(duration - currentTime)
        : null,
  };
}

function update(native: TahtiNativeDiscord) {
  if (!useDesktopDiscordStore.getState().enabled) {
    return;
  }
  const presence = currentPresence();
  const request = presence
    ? native.setActivity(presence).then((reconnected) => {
        if (reconnected) {
          toast.info('Reconnected to Discord');
        }
      })
    : native.clearActivity();
  request.catch(() => undefined);
}

/** Keeps Discord's "Listening to" in step with the player while the switch is on. */
export async function initDesktopDiscord(): Promise<void> {
  const native = getNativeDiscord();
  if (!native) {
    return;
  }
  let previous = usePlayerStore.getState();
  usePlayerStore.subscribe((next) => {
    const before = previous;
    previous = next;
    if (
      next.currentId !== before.currentId ||
      next.status !== before.status ||
      (before.duration === 0 && next.duration > 0)
    ) {
      update(native);
    }
  });
  useDesktopDiscordStore.subscribe((next, before) => {
    if (next.enabled && !before.enabled) {
      update(native);
    }
  });
  setInterval(() => update(native), HEARTBEAT_MS);
  await useDesktopDiscordStore.getState().resume();
}
