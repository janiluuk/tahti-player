import { apiBase } from './http';
import { FORCE_MOCK } from './mode';

export type ListenSource =
  | 'CHANNEL_PAGE'
  | 'TAHTI_RADIO'
  | 'ARTIST_PROFILE'
  | 'DISCOVER'
  | 'LIBRARY'
  | 'EMBED'
  | 'OTHER';

export type ListenTarget = { soundId: string } | { channelSlug: string };

export type ListenPosition = { positionSec: number; durationSec: number };

/** Host of the page that sent the listener here, without `www.`; null when
 * there is none or it is this site. Only the host is ever sent. */
export function referrerHostOf(
  referrer: string,
  ownHost: string,
): string | null {
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    return host && host !== ownHost.toLowerCase().replace(/^www\./, '')
      ? host
      : null;
  } catch {
    return null;
  }
}

/** Full document.referrer for the API (server strips credentials/fragment). */
export function referrerUrlOf(
  referrer: string,
  ownHost: string,
): string | null {
  if (!referrer || !referrerHostOf(referrer, ownHost)) {
    return null;
  }
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    url.username = '';
    url.password = '';
    url.hash = '';
    const out = url.toString();
    return out.length > 2048 ? out.slice(0, 2048) : out;
  } catch {
    return null;
  }
}

const entryReferrer =
  typeof document === 'undefined'
    ? { host: null as string | null, url: null as string | null }
    : {
        host: referrerHostOf(document.referrer, window.location.hostname),
        url: referrerUrlOf(document.referrer, window.location.hostname),
      };

/** "Still listening" ping for listen-time stats. The API opens or extends
 * a listen session per listener and closes it when the pings stop. Tracks
 * also report how far they have played, for the loyalty curve. Fire-and-
 * forget: never affects playback. */
export function sendListenHeartbeat(
  target: ListenTarget,
  source: ListenSource,
  position?: ListenPosition,
  referrerHost: string | null = entryReferrer.host,
  referrerUrl: string | null = entryReferrer.url,
): void {
  if (FORCE_MOCK) {
    return;
  }
  void fetch(`${apiBase()}/api/v1/listen/heartbeat`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...target,
      source,
      ...(referrerHost ? { referrerHost } : {}),
      ...(referrerUrl ? { referrerUrl } : {}),
      ...(position ?? {}),
    }),
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
