import type { PublicCollection } from '../api/types';

export type Rgb = [number, number, number];

/** The image a playlist page takes its tint from: the collection cover,
 * else the first track with its own cover. Never the generated placeholder
 * artwork, so a playlist without any artwork stays on the theme
 * background. */
export function collectionTintUrl(
  collection: Pick<PublicCollection, 'coverUrl' | 'items'>,
): string | null {
  if (collection.coverUrl) {
    return collection.coverUrl;
  }
  for (const item of collection.items) {
    if (item.sound?.bannerUrl) {
      return item.sound.bannerUrl;
    }
  }
  return null;
}

/** Strongest alpha of the cover wash; low enough that theme text keeps its
 * contrast on top in light and dark mode. */
export const COVER_WASH_MAX_ALPHA = 0.3;

/** A soft diagonal wash of `rgb` that fades out over the theme surface. */
export function coverWash([r, g, b]: Rgb): string {
  return `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, ${COVER_WASH_MAX_ALPHA}), rgba(${r}, ${g}, ${b}, 0.1) 45%, transparent 85%)`;
}
