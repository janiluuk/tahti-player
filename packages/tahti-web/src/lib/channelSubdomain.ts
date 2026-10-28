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

/** Where `<label>.tahti.live` lands, as the old app did: the bare root of a
 * channel subdomain opens that channel, `radio.` opens the station and the
 * legacy `tahti-radio.` moves to `radio.`. Only the entry URL: once the app is
 * running, "/" on the subdomain is Listen like everywhere else. `?home=1` is
 * the old app's explicit "take me home" marker and is honoured. */
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
  const path = label === 'radio' ? '/radio' : `/channel/${label}`;
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
