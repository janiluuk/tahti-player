import { i18n } from '@tahti-player/i18n';

import { listenerFingerprint } from '../lib/listenerFingerprint';
import { apiBase } from './http';
import { DEMO_MP3 } from './mock';
import { ensureMockUploadedSound } from './mock-uploads';
import { isForceMock } from './mode';
import { withShareKey } from './share-key';

function downloadsDisabledMessage(): string {
  return i18n.t('web:batch54.downloadsOff');
}

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
        error: downloadsDisabledMessage(),
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
  const path = `/api/v1/c/${encodeURIComponent(channelSlug)}/sounds/${encodeURIComponent(itemId)}/download`;
  let lastError = i18n.t('web:batch54.downloadUnavailable');
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
          error: downloadsDisabledMessage(),
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
