import { listenerFingerprint } from '../lib/listenerFingerprint';
import { apiBase } from './http';
import { DEMO_MP3 } from './mock';
import { ensureMockUploadedSound } from './mock-uploads';
import { isForceMock } from './mode';
import { withShareKey } from './share-key';

export const DOWNLOADS_DISABLED_MESSAGE =
  'The artist has turned off downloads for this track.';

export type PublicSoundDownloadResult =
  | { ok: true; url: string; filename?: string }
  | { ok: false; error: string; downloadsDisabled?: true };

const SOUND_DOWNLOAD_SOURCE_FORMAT = 'source';

type DownloadBody = {
  url?: string;
  filename?: string;
  error?: string;
  message?: string;
  code?: string;
};

export async function fetchPublicSoundDownload(
  channelSlug: string,
  itemId: string,
  shareKey?: string,
): Promise<PublicSoundDownloadResult> {
  if (isForceMock()) {
    const uploaded = await ensureMockUploadedSound(itemId);
    if (uploaded?.downloadsEnabled === false) {
      return {
        ok: false,
        error: DOWNLOADS_DISABLED_MESSAGE,
        downloadsDisabled: true,
      };
    }
    if (uploaded?.objectUrl) {
      return {
        ok: true,
        url: uploaded.objectUrl,
        filename: uploaded.filename,
      };
    }
    return { ok: true, url: DEMO_MP3, filename: 'tahti-sound.mp3' };
  }
  const fp = encodeURIComponent(listenerFingerprint());
  const path = `/api/v1/c/${encodeURIComponent(channelSlug)}/archive/${encodeURIComponent(itemId)}/download`;
  let lastError = 'Download unavailable';
  for (const format of [SOUND_DOWNLOAD_SOURCE_FORMAT, undefined]) {
    const query = format ? `?fp=${fp}&format=${format}` : `?fp=${fp}`;
    try {
      const res = await fetch(
        `${apiBase()}${withShareKey(`${path}${query}`, shareKey)}`,
        { credentials: 'include', headers: { Accept: 'application/json' } },
      );
      const body = (await res.json().catch(() => ({}))) as DownloadBody;
      if (res.ok && body.url) {
        return { ok: true, url: body.url, filename: body.filename };
      }
      if (body.code === 'downloads_disabled') {
        return {
          ok: false,
          error: DOWNLOADS_DISABLED_MESSAGE,
          downloadsDisabled: true,
        };
      }
      if (!res.ok) {
        lastError = body.error ?? body.message ?? lastError;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }
  return { ok: false, error: lastError };
}
