import type { EmbedProvider } from './embedSrc';

type OembedPayload = {
  thumbnail_url?: string;
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

/** Best-effort provider thumbnail via noembed (CORS). Cached per page URL. */
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
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(pageUrl)}`,
    );
    if (!res.ok) {
      cache.set(pageUrl, null);
      return null;
    }
    const data = (await res.json()) as OembedPayload;
    const thumb = data.thumbnail_url?.trim() || null;
    cache.set(pageUrl, thumb);
    return thumb;
  } catch {
    cache.set(pageUrl, null);
    return null;
  }
}
