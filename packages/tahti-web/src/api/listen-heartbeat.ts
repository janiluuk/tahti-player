import { apiBase } from './http';
import { isForceMock } from './mode';

export type ListenSource =
  | 'CHANNEL_PAGE'
  | 'TAHTI_RADIO'
  | 'ARTIST_PROFILE'
  | 'DISCOVER'
  | 'LIBRARY'
  | 'EMBED'
  | 'OTHER';

export type ListenTarget = { soundId: string } | { channelSlug: string };

/** "Still listening" ping for listen-time stats. The API opens or extends
 * a listen session per listener and closes it when the pings stop, so no
 * duration is sent. Fire-and-forget: never affects playback. */
export function sendListenHeartbeat(
  target: ListenTarget,
  source: ListenSource,
): void {
  if (isForceMock()) {
    return;
  }
  void fetch(`${apiBase()}/api/v1/listen/heartbeat`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...target, source }),
  }).catch(() => undefined);
}

/** Which surface the listener is on, from the page they're viewing. */
export function listenSourceForPath(pathname: string): ListenSource {
  if (pathname.startsWith('/embed')) {
    return 'EMBED';
  }
  if (pathname.startsWith('/radio')) {
    return 'TAHTI_RADIO';
  }
  if (pathname.startsWith('/channel')) {
    return 'CHANNEL_PAGE';
  }
  if (pathname.startsWith('/u/')) {
    return 'ARTIST_PROFILE';
  }
  if (pathname.startsWith('/discover')) {
    return 'DISCOVER';
  }
  if (pathname.startsWith('/library') || pathname.startsWith('/favorites')) {
    return 'LIBRARY';
  }
  return 'OTHER';
}
