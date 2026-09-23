import { type PublicTrackDetail, type TahtiPlayable } from '../../api/types';

/** Fallback bar count for the synthetic (no-peaks) waveform only. Real peaks
 * render at their native resolution instead of being downsampled to this. */
export const WAVEFORM_BARS = 180;
export const PLAYED_WAVE_COLOR = '#6CFF6B';
export const UNPLAYED_WAVE_COLOR = 'rgba(255,255,255,0.78)';

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
    // Only hearthis.at has a shared-player-wide embed widget (the bottom
    // bar and fullscreen player special-case `embed.provider: 'hearthis'`);
    // Mixcloud/Spotify/Bandcamp only ever play through this page's own
    // inline widget below, same as everywhere else those three appear.
    embed:
      detail.embedProvider === 'HEARTHIS' && detail.embedUri
        ? { provider: 'hearthis', embedUri: detail.embedUri }
        : undefined,
    sourceProvider:
      detail.embedProvider === 'HEARTHIS' ? 'hearthis' : undefined,
    channelSlug: detail.channelSlug,
    durationSec: detail.durationSec ?? undefined,
    peaks: detail.peaks,
  };
}

export function formatReleasedOn(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `on ${day}.${month}.${date.getFullYear()}`;
}

export function cueLabel(artist: string | null, title: string): string {
  return artist ? `${artist} - ${title}` : title;
}
