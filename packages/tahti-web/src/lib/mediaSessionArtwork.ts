import type { Artwork } from '@tahti-player/model';

import { isPlaceholderArtworkUrl } from './placeholderArt';

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  avif: 'image/avif',
};

export function artworkMimeType(src: string): string | undefined {
  if (src.startsWith('data:')) {
    const mime = /^data:([^;,]+)/.exec(src)?.[1]?.trim().toLowerCase();
    return mime?.startsWith('image/') ? mime : undefined;
  }
  const path = src.split(/[?#]/, 1)[0] ?? '';
  const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
  return extension ? MIME_BY_EXTENSION[extension] : undefined;
}

/**
 * MediaSession artwork for the current queue item: the first artwork entry
 * plus any alternate resolutions sharing its purpose. The generated SVG
 * placeholder is dropped because OS media UIs (macOS Now Playing, Windows
 * SMTC, Android) do not reliably render SVG, and substituting a different
 * raster image would disagree with the cover shown in the app.
 */
export function mediaSessionArtwork(items: readonly Artwork[]): MediaImage[] {
  const first = items[0];
  if (!first) {
    return [];
  }
  return items
    .filter(
      (item) =>
        item.purpose === first.purpose &&
        item.url !== '' &&
        !isPlaceholderArtworkUrl(item.url),
    )
    .map((item) => {
      const type = artworkMimeType(item.url);
      return {
        src: item.url,
        ...(item.width && item.height
          ? { sizes: `${item.width}x${item.height}` }
          : {}),
        ...(type ? { type } : {}),
      };
    });
}
