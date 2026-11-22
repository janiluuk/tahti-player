const ROOT_DOMAIN = 'tahti.live';

/** Subdomains that are services or reserved words, never a channel: tahti-org
 * `RESERVED_CHANNEL_SLUGS` plus the hosts the proxy serves itself. */
const NOT_CHANNELS = new Set([
  'admin',
  'api',
  'app',
  'apply',
  'auth',
  'beta',
  'c',
  'cdn',
  'chat',
  'dashboard',
  'dev',
  'embed',
  'feed',
  'governance',
  'grafana',
  'help',
  'ingest',
  'ingest-b',
  'ingest-icecast',
  'ingest-icecast-b',
  'join',
  'listen',
  'login',
  'logs',
  'mail',
  'minio',
  'r',
  'registry',
  'reserved',
  'setup-password',
  'signup',
  'staging',
  'status',
  'storybook',
  'stream',
  'support',
  'tahti',
  'taken',
  'transparency',
  'u',
  'v',
  'venues',
  'verify',
  'webmail',
  'www',
]);

export type SubdomainEntry =
  { kind: 'path'; path: string } | { kind: 'url'; url: string };

/** Artist slug from `slug.tahti.live`, or null for apex / reserved hosts. */
export function artistSubdomainLabel(hostname: string): string | null {
  const host = hostname.toLowerCase();
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) {
    return null;
  }
  const label = host.slice(0, -(ROOT_DOMAIN.length + 1));
  if (
    !/^[a-z0-9-]+$/.test(label) ||
    NOT_CHANNELS.has(label) ||
    label === 'radio' ||
    label === 'tahti-radio'
  ) {
    return null;
  }
  return label;
}

/** Where `<label>.tahti.live` lands: bare root opens the full artist page
 * (`/u/<label>`). Channel stream stays at `/channel/<label>`. `radio.` opens
 * the station; legacy `tahti-radio.` moves to `radio.`. `?home=1` skips the
 * rewrite (Listen). */
export function subdomainEntry(location: {
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
}): SubdomainEntry | null {
  const hostname = location.hostname.toLowerCase();
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return null;
  }
  const label = hostname.slice(0, -(ROOT_DOMAIN.length + 1));
  if (!/^[a-z0-9-]+$/.test(label) || NOT_CHANNELS.has(label)) {
    return null;
  }
  if (label === 'tahti-radio') {
    return {
      kind: 'url',
      url: `https://radio.${ROOT_DOMAIN}${location.pathname}${location.search}${location.hash}`,
    };
  }
  const params = new URLSearchParams(location.search);
  if (location.pathname !== '/' || params.get('home') === '1') {
    return null;
  }
  const path = label === 'radio' ? '/radio' : `/u/${label}`;
  return { kind: 'path', path: `${path}${location.search}${location.hash}` };
}

/** Applies `subdomainEntry` before the router reads the URL. */
export function applySubdomainEntry(win: Window) {
  const entry = subdomainEntry(win.location);
  if (entry?.kind === 'url') {
    win.location.replace(entry.url);
  } else if (entry?.kind === 'path') {
    win.history.replaceState(win.history.state, '', entry.path);
  }
}

/** True on the artist's own subdomain for their full site home or channel. */
export function isArtistSubdomainPage(
  hostname: string,
  pathname: string,
): boolean {
  const slug = artistSubdomainLabel(hostname);
  if (!slug) {
    return false;
  }
  const path = pathname.replace(/\/$/, '') || '/';
  return path === `/u/${slug}` || path === `/channel/${slug}`;
}

/** Apex / shared hosts show the short Link page at `/u/:username`. */
export function isApexHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return true;
  }
  if (host === `app.${ROOT_DOMAIN}` || host === `beta.${ROOT_DOMAIN}`) {
    return true;
  }
  if (host === 'localhost' || host.startsWith('localhost:')) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+/.test(host)) {
    return true;
  }
  return false;
}
