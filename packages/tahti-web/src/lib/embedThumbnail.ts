import { apiBase } from '../api/http';
import { isForceMock } from '../api/mode';
import type { EmbedProvider } from './embedSrc';

type EmbedThumbnailPayload = {
  thumbnailUrl?: string | null;
};

const MEMORY = new Map<string, string | null>();
const PENDING = new Map<string, Promise<string | null>>();
const STORAGE_PREFIX = 'tahti-web:embed-thumb:';
const MAX_IN_FLIGHT = 3;
const MOCK_THUMBNAIL = '/mock/dj-moonlight/cover-moonlight-drive.svg';

class RateLimited extends Error {}

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
    .catch((err: unknown) => {
      if (!(err instanceof RateLimited)) {
        writeStored(pageUrl, null);
      }
      return null;
    })
    .finally(() => {
      PENDING.delete(pageUrl);
    });
  PENDING.set(pageUrl, promise);
  return promise;
}

export function embedPageUrl(
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

async function lookupThumbnail(pageUrl: string): Promise<string | null> {
  if (isForceMock()) {
    return pageUrl.startsWith('https://') ? MOCK_THUMBNAIL : null;
  }
  const res = await fetch(
    `${apiBase()}/api/v1/embeds/thumbnail?url=${encodeURIComponent(pageUrl)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (res.status === 429) {
    throw new RateLimited();
  }
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as EmbedThumbnailPayload;
  return data.thumbnailUrl?.trim() || null;
}

export async function fetchEmbedThumbnail(input: {
  provider: EmbedProvider;
  embedUri: string;
  sourceUrl?: string | null;
}): Promise<string | null> {
  const pageUrl = embedPageUrl(input.provider, input.embedUri, input.sourceUrl);
  if (!pageUrl) {
    return null;
  }
  return remember(pageUrl, () => lookupThumbnail(pageUrl));
}

export function fetchOembedThumbnail(pageUrl: string): Promise<string | null> {
  const trimmed = pageUrl.trim();
  if (!trimmed) {
    return Promise.resolve(null);
  }
  return remember(trimmed, () => lookupThumbnail(trimmed));
}
