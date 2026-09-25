import type { DiscoverTrackItem, TahtiPlayable } from '../api/types';

export function discoverTrackPlayable(
  item: DiscoverTrackItem,
): TahtiPlayable | null {
  if (!item.audioUrl) {
    return null;
  }
  return {
    id: item.id,
    kind: 'sound',
    title: item.title,
    artist: item.artist,
    coverUrl: item.coverUrl ?? undefined,
    streamUrl: item.audioUrl,
    protocol: item.audioUrl.includes('.m3u8') ? 'hls' : 'https',
    channelSlug: item.channelSlug,
    durationSec: item.durationSec ?? undefined,
  };
}
