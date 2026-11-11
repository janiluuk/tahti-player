import type { EmbedProvider } from './embedSrc';

type OembedPayload = {
  thumbnail_url?: string;
};

type HearthisTrackPayload = {
  artwork_url?: string | null;
  artwork_url_retina?: string | null;
};

const cache = new Map<string, string | null>();

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

async function lookupThumbnail(
  provider: EmbedProvider,
  pageUrl: string,
): Promise<string | null> {
  if (provider === 'HEARTHIS') {
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
  if (cache.has(pageUrl)) {
    return cache.get(pageUrl) ?? null;
  }
  try {
    const thumb = await lookupThumbnail(input.provider, pageUrl);
    cache.set(pageUrl, thumb);
    return thumb;
  } catch {
    cache.set(pageUrl, null);
    return null;
  }
}
