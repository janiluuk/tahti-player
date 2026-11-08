import type { SearchTrackResult } from '../api/search-types';
import type { TahtiPlayable } from '../api/types';
import { playableFromStudioEmbed } from './embedPlayback';

/** A search / tag-search track as a playable row, or null when the viewer
 * can't play it here (gated, or the API sent no stream). */
export function searchTrackPlayable(
  track: SearchTrackResult,
): TahtiPlayable | null {
  if (track.audioUrl) {
    return {
      id: track.id.startsWith('sound:') ? track.id : `sound:${track.id}`,
      kind: 'sound',
      title: track.title,
      artist: track.artistName,
      coverUrl: track.coverUrl ?? undefined,
      streamUrl: track.audioUrl,
      protocol: track.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: track.channelSlug,
      durationSec: track.durationSec ?? undefined,
      peaks: track.peaks ?? null,
    };
  }
  const embed = playableFromStudioEmbed({
    id: track.id,
    title: track.title,
    artistName: track.artistName,
    bannerUrl: track.coverUrl,
    embedProvider: track.embedProvider,
    embedUri: track.embedUri,
    durationSec: track.durationSec,
  });
  return embed ? { ...embed, channelSlug: track.channelSlug } : null;
}
