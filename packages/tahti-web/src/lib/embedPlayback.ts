import type { EmbedPlaybackProvider, TahtiPlayable } from '../api/types';
import { toEmbedPlaybackProvider } from './embedSrc';

/** Playback for EMBED_ONLY tracks (hearthis.at / Mixcloud / Spotify /
 * Bandcamp) always goes through the provider widget in the shared player
 * bar. Hotlinked `stream_url` values (and the editor-source DEMO_MP3
 * fallback) are silent or blocked — never use them as `<audio src>`. */
export function playableFromEmbed(
  provider: EmbedPlaybackProvider,
  input: {
    playerId: string;
    title: string;
    artist: string;
    coverUrl?: string;
    embedUri: string;
    durationSec?: number | null;
  },
): TahtiPlayable {
  return {
    id: input.playerId,
    kind: 'sound',
    title: input.title,
    artist: input.artist,
    coverUrl: input.coverUrl,
    streamUrl: '',
    protocol: 'https',
    sourceProvider: provider,
    durationSec: input.durationSec ?? undefined,
    embed: { provider, embedUri: input.embedUri },
  };
}

/** hearthis.at-specific convenience wrapper around {@link playableFromEmbed}. */
export function playableFromHearthisEmbed(input: {
  playerId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  embedUri: string;
  durationSec?: number | null;
}): TahtiPlayable {
  return playableFromEmbed('hearthis', input);
}

export function playableFromStudioHearthis(item: {
  id: string;
  title: string;
  artistName?: string | null;
  bannerUrl?: string | null;
  embedProvider?: string | null;
  embedUri?: string | null;
  durationSec?: number | null;
}): TahtiPlayable | null {
  if (item.embedProvider !== 'HEARTHIS' || !item.embedUri) {
    return null;
  }
  return playableFromHearthisEmbed({
    playerId: `sound:${item.id}`,
    title: item.title,
    artist: item.artistName || 'hearthis.at',
    coverUrl: item.bannerUrl ?? undefined,
    embedUri: item.embedUri,
    durationSec: item.durationSec,
  });
}

/** Maps any EMBED_ONLY studio sound (hearthis.at / Mixcloud / Spotify /
 * Bandcamp) onto a shared-player playable, or `null` when the item has no
 * hosted audio and no embed to fall back on. */
export function playableFromStudioEmbed(item: {
  id: string;
  title: string;
  artistName?: string | null;
  bannerUrl?: string | null;
  embedProvider?: string | null;
  embedUri?: string | null;
  durationSec?: number | null;
}): TahtiPlayable | null {
  if (
    item.embedProvider !== 'HEARTHIS' &&
    item.embedProvider !== 'MIXCLOUD' &&
    item.embedProvider !== 'SPOTIFY' &&
    item.embedProvider !== 'BANDCAMP'
  ) {
    return null;
  }
  if (!item.embedUri) {
    return null;
  }
  const provider = toEmbedPlaybackProvider(
    item.embedProvider as 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP',
  );
  return playableFromEmbed(provider, {
    playerId: `sound:${item.id}`,
    title: item.title,
    artist: item.artistName || 'Unknown',
    coverUrl: item.bannerUrl ?? undefined,
    embedUri: item.embedUri,
    durationSec: item.durationSec,
  });
}
