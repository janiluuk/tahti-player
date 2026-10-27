import { fetchPublicSoundDownload } from '../api/public-sound-download';
import { fetchDownloadGates } from '../api/sound-download-gates';

export type TrackDownloadOutcome =
  { kind: 'started' } | { kind: 'gated' } | { kind: 'failed'; error: string };

/** Starts a public track download from a list row. When the artist asks
 * listeners to follow or share first, answers `gated` so the caller can
 * send them to the track page, where the gate dialog lives. */
export async function downloadTrackFromRow(
  channelSlug: string,
  soundId: string,
  title: string,
): Promise<TrackDownloadOutcome> {
  const gates = await fetchDownloadGates(channelSlug, soundId);
  if (gates && !gates.canDownload) {
    return { kind: 'gated' };
  }
  const result = await fetchPublicSoundDownload(channelSlug, soundId);
  if (!result.ok) {
    return { kind: 'failed', error: result.error };
  }
  const link = document.createElement('a');
  link.href = result.url;
  link.download =
    result.filename ??
    `${title.replace(/[^\w.\- ]+/g, '').trim() || 'track'}.wav`;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return { kind: 'started' };
}
