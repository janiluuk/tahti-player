import { useEffect } from 'react';

import {
  listenSourceForPath,
  sendListenHeartbeat,
  type ListenTarget,
} from '../api/listen-heartbeat';
import { usePlayerStore } from '../stores/playerStore';

/** tahti-org asks for a ping every 3 minutes while something plays. */
export const LISTEN_HEARTBEAT_MS = 3 * 60 * 1000;

/** Tahti tracks and channels only: `sound:<id>`, or `live:`/`radio:` plus
 * a channel slug. Personal internet radio stations aren't Tahti channels. */
export function listenTargetFor(
  currentId: string | null,
  provider: string | undefined,
): ListenTarget | null {
  if (!currentId || provider === 'internet-radio') {
    return null;
  }
  const separator = currentId.indexOf(':');
  const kind = currentId.slice(0, separator);
  const rest = currentId.slice(separator + 1);
  if (separator < 0 || !rest) {
    return null;
  }
  if (kind === 'sound') {
    return { soundId: rest };
  }
  if (kind === 'live' || kind === 'radio') {
    return { channelSlug: rest };
  }
  return null;
}

/** Sends listen-time heartbeats while playback is running. */
export function ListenHeartbeat() {
  const currentId = usePlayerStore((s) => s.currentId);
  const playing = usePlayerStore((s) => s.status === 'playing');
  const provider = usePlayerStore(
    (s) =>
      s.queue.find((item) => item.id === s.currentId)?.track.source.provider,
  );

  useEffect(() => {
    const target = playing ? listenTargetFor(currentId, provider) : null;
    if (!target) {
      return;
    }
    const ping = () =>
      sendListenHeartbeat(
        target,
        listenSourceForPath(window.location.pathname),
      );
    ping();
    const timer = window.setInterval(ping, LISTEN_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [currentId, playing, provider]);

  return null;
}
