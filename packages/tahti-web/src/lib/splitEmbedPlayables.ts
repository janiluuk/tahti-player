import type { TahtiPlayable } from '../api/types';

/** Splits a catalog into Tahti-hosted tracks and third-party embeds
 * (SoundCloud, YouTube, Mixcloud…), keeping each group's order. */
export function splitEmbedPlayables(items: TahtiPlayable[]): {
  tracks: TahtiPlayable[];
  embeds: TahtiPlayable[];
} {
  const tracks: TahtiPlayable[] = [];
  const embeds: TahtiPlayable[] = [];
  for (const item of items) {
    (item.embed ? embeds : tracks).push(item);
  }
  return { tracks, embeds };
}
