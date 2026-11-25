import { artistSubdomainLabel } from './channelSubdomain';

/** Hosts that serve this same SPA with the same routes. */
const SHARED_HOSTS = new Set([
  'tahti.live',
  'www.tahti.live',
  'app.tahti.live',
  'beta.tahti.live',
]);

/**
 * The in-app path for a link the SPA can open itself, or null when it points
 * at another site. Following a full URL to `slug.tahti.live` or another
 * Tahti host reloads the page, which stops playback; the artist subdomain
 * root maps to the full artist page at `/u/<slug>?full=1`.
 */
export function inAppPath(url: string, currentOrigin: string): string | null {
  let target: URL;
  try {
    target = new URL(url, currentOrigin);
  } catch {
    return null;
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return null;
  }
  const path = `${target.pathname}${target.search}${target.hash}`;
  if (target.origin === currentOrigin) {
    return path;
  }
  if (target.protocol !== 'https:') {
    return null;
  }
  const host = target.hostname.toLowerCase();
  if (SHARED_HOSTS.has(host)) {
    return path;
  }
  const slug = artistSubdomainLabel(host);
  if (!slug) {
    return null;
  }
  const pathname = target.pathname.replace(/\/$/, '') || '/';
  const params = new URLSearchParams(target.search);
  const siteHome = pathname === '/' && params.get('home') !== '1';
  if (siteHome || pathname === `/u/${slug}`) {
    params.set('full', '1');
    return `/u/${slug}?${params.toString()}${target.hash}`;
  }
  return path;
}
