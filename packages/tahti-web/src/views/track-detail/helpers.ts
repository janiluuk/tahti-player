import { type PublicTrackDetail, type TahtiPlayable } from '../../api/types';
import { toEmbedPlaybackProvider } from '../../lib/embedSrc';

/** Fallback bar count for the synthetic (no-peaks) waveform only. Real peaks
 * render at their native resolution instead of being downsampled to this. */
export const WAVEFORM_BARS = 180;

/** DOM id of the hero's comment input, so the comments list can focus it. */
export const TRACK_COMMENT_INPUT_ID = 'track-comment-input';

export function playableFromDetail(
  id: string,
  detail: PublicTrackDetail,
): TahtiPlayable {
  return {
    id: `sound:${id}`,
    kind: 'sound',
    title: detail.title,
    artist: detail.artistName,
    coverUrl: detail.bannerUrl ?? undefined,
    streamUrl: detail.audioUrl ?? '',
    protocol: detail.audioUrl?.includes('.m3u8') ? 'hls' : 'https',
    embed:
      detail.embedProvider && detail.embedUri
        ? {
            provider: toEmbedPlaybackProvider(detail.embedProvider),
            embedUri: detail.embedUri,
          }
        : undefined,
    sourceProvider: detail.embedProvider
      ? toEmbedPlaybackProvider(detail.embedProvider)
      : undefined,
    channelSlug: detail.channelSlug,
    durationSec: detail.durationSec ?? undefined,
    peaks: detail.peaks,
  };
}

export function cueLabel(artist: string | null, title: string): string {
  return artist ? `${artist} - ${title}` : title;
}
