import type {
  EmbedPlaybackProvider,
  PublicCollection,
  TahtiPlayable,
} from '../api/types';
import { toEmbedPlaybackProvider } from './embedSrc';
import { placeholderArtworkUrl } from './placeholderArt';

function collectionSoundToPlayable(
  sound: NonNullable<PublicCollection['items'][number]['sound']>,
  col: PublicCollection,
): TahtiPlayable | null {
  const coverUrl =
    sound.bannerUrl ??
    col.coverUrl ??
    placeholderArtworkUrl(`${col.slug}:${sound.id}`);
  if (sound.audioUrl) {
    return {
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: sound.title,
      artist: col.user.displayName,
      coverUrl,
      streamUrl: sound.audioUrl,
      protocol: sound.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: sound.channel?.slug,
      durationSec: sound.durationSec ?? undefined,
      releaseDate: sound.createdAt ?? null,
      peaks: sound.peaks ?? null,
    };
  }
  if (sound.embedProvider && sound.embedUri) {
    const provider: EmbedPlaybackProvider = toEmbedPlaybackProvider(
      sound.embedProvider,
    );
    return {
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: sound.title,
      artist: col.user.displayName,
      coverUrl,
      streamUrl: '',
      protocol: 'https',
      channelSlug: sound.channel?.slug,
      sourceProvider: provider,
      embed: { provider, embedUri: sound.embedUri },
    };
  }
  return null;
}

/** Every playable in a collection — both Tahti-hosted tracks and the
 * provider's-own-widget (hearthis.at / Mixcloud / Spotify / Bandcamp)
 * embeds — in original item order, so listeners see one list. */
export function collectionToPlayables(col: PublicCollection): TahtiPlayable[] {
  const out: TahtiPlayable[] = [];
  for (const item of col.items) {
    if (!item.sound) {
      continue;
    }
    const playable = collectionSoundToPlayable(item.sound, col);
    if (playable) {
      out.push(playable);
    }
  }
  return out;
}
