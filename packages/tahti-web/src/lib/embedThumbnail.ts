import type { EmbedProvider } from './embedSrc';

type OembedPayload = {
  thumbnail_url?: string;
};

type HearthisTrackPayload = {
  artwork_url?: string | null;
  artwork_url_retina?: string | null;
};

const MEMORY = new Map<string, string | null>();
const PENDING = new Map<string, Promise<string | null>>();
const STORAGE_PREFIX = 'tahti-web:embed-thumb:';
const MAX_IN_FLIGHT = 3;

let inFlight = 0;
const waiters: Array<() => void> = [];

function withLimit<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      inFlight += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          inFlight -= 1;
          waiters.shift()?.();
        });
    };
    if (inFlight < MAX_IN_FLIGHT) {
      run();
    } else {
      waiters.push(run);
    }
  });
}

function readStored(pageUrl: string): string | null | undefined {
  if (MEMORY.has(pageUrl)) {
    return MEMORY.get(pageUrl) ?? null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + pageUrl);
    if (raw === null) {
      return undefined;
    }
    const value = raw === '' ? null : raw;
    MEMORY.set(pageUrl, value);
    return value;
  } catch {
    return undefined;
  }
}

function writeStored(pageUrl: string, value: string | null) {
  MEMORY.set(pageUrl, value);
  try {
    sessionStorage.setItem(STORAGE_PREFIX + pageUrl, value ?? '');
  } catch {
    return;
  }
}

export function clearEmbedThumbnailMemory() {
  MEMORY.clear();
  PENDING.clear();
}

export function clearEmbedThumbnailCache() {
  clearEmbedThumbnailMemory();
  inFlight = 0;
  waiters.length = 0;
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    return;
  }
}

function remember(
  pageUrl: string,
  load: () => Promise<string | null>,
): Promise<string | null> {
  const stored = readStored(pageUrl);
  if (stored !== undefined) {
    return Promise.resolve(stored);
  }
  const pending = PENDING.get(pageUrl);
  if (pending) {
    return pending;
  }
  const promise = withLimit(load)
    .then((value) => {
      writeStored(pageUrl, value);
      return value;
    })
    .catch(() => {
      writeStored(pageUrl, null);
      return null;
    })
    .finally(() => {
      PENDING.delete(pageUrl);
    });
  PENDING.set(pageUrl, promise);
  return promise;
}

function pageUrlFor(
  provider: EmbedProvider,
  embedUri: string,
  sourceUrl?: string | null,
): string | null {
  if (sourceUrl?.trim()) {
    return sourceUrl.trim();
  }
  switch (provider) {
    case 'SPOTIFY':
      return embedUri.startsWith('http')
        ? embedUri
        : `https://open.spotify.com/track/${embedUri}`;
    case 'MIXCLOUD':
      return embedUri.startsWith('http')
        ? embedUri
        : `https://www.mixcloud.com${embedUri.startsWith('/') ? '' : '/'}${embedUri}`;
    case 'BANDCAMP':
      return embedUri.startsWith('http') ? embedUri : null;
    case 'HEARTHIS':
      return null;
    case 'MIKSERI':
      return embedUri.startsWith('http') ? embedUri : null;
    default:
      return null;
  }
}

export function hearthisApiUrl(pageUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  if (!/^(www\.)?hearthis\.at$/i.test(url.hostname)) {
    return null;
  }
  const path = url.pathname.replace(/\/?$/, '/');
  return /^\/[^/]+\/[^/]+\/$/.test(path)
    ? `https://api-v2.hearthis.at${path}`
    : null;
}

async function lookupHearthis(pageUrl: string): Promise<string | null> {
  const apiUrl = hearthisApiUrl(pageUrl);
  if (!apiUrl) {
    return null;
  }
  const res = await fetch(apiUrl);
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as HearthisTrackPayload;
  return data.artwork_url_retina?.trim() || data.artwork_url?.trim() || null;
}

async function lookupOembed(pageUrl: string): Promise<string | null> {
  const res = await fetch(
    `https://noembed.com/embed?url=${encodeURIComponent(pageUrl)}`,
  );
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as OembedPayload;
  return data.thumbnail_url?.trim() || null;
}

/**
 * Best-effort provider thumbnail: hearthis.at's public API for hearthis
 * pages, noembed (CORS) for the rest. Cached per page URL.
 */
export async function fetchEmbedThumbnail(input: {
  provider: EmbedProvider;
  embedUri: string;
  sourceUrl?: string | null;
}): Promise<string | null> {
  const pageUrl = pageUrlFor(input.provider, input.embedUri, input.sourceUrl);
  if (!pageUrl) {
    return null;
  }
  return remember(pageUrl, () =>
    input.provider === 'HEARTHIS'
      ? lookupHearthis(pageUrl)
      : lookupOembed(pageUrl),
  );
}

export function fetchOembedThumbnail(pageUrl: string): Promise<string | null> {
  const trimmed = pageUrl.trim();
  if (!trimmed) {
    return Promise.resolve(null);
  }
  return remember(trimmed, () => lookupOembed(trimmed));
}
