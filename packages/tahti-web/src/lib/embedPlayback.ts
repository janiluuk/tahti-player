import type { TahtiPlayable } from '../api/types';

/** hearthis.at playback always goes through the provider widget in the
 * shared player bar. Hotlinked `stream_url` values (and the editor-source
 * DEMO_MP3 fallback) are silent or blocked — never use them as `<audio src>`. */
export function playableFromHearthisEmbed(input: {
  playerId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  embedUri: string;
  durationSec?: number | null;
}): TahtiPlayable {
  return {
    id: input.playerId,
    kind: 'archive',
    title: input.title,
    artist: input.artist,
    coverUrl: input.coverUrl,
    streamUrl: '',
    protocol: 'https',
    sourceProvider: 'hearthis',
    durationSec: input.durationSec ?? undefined,
    embed: { provider: 'hearthis', embedUri: input.embedUri },
  };
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
    playerId: `archive:${item.id}`,
    title: item.title,
    artist: item.artistName || 'hearthis.at',
    coverUrl: item.bannerUrl ?? undefined,
    embedUri: item.embedUri,
    durationSec: item.durationSec,
  });
}
