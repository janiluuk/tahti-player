import { listenerFingerprint } from '../lib/listenerFingerprint';
import { getJson } from './http';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type DownloadGateStatus = {
  repostRequired: boolean;
  followRequired: boolean;
  repostSatisfied: boolean;
  followSatisfied: boolean;
  canDownload: boolean;
};

const gatePath = (slug: string, soundId: string, action: string) =>
  `/api/v1/c/${encodeURIComponent(slug)}/sounds/${encodeURIComponent(soundId)}/${action}?fp=${encodeURIComponent(listenerFingerprint())}`;

/** What a listener still has to do before a track downloads (`GET …/download-gates`). */
export async function fetchDownloadGates(
  slug: string,
  soundId: string,
): Promise<DownloadGateStatus | null> {
  if (isForceMock()) {
    return null;
  }
  try {
    return await getJson<DownloadGateStatus>(
      gatePath(slug, soundId, 'download-gates'),
    );
  } catch {
    return null;
  }
}

/** Records that the listener shared the track (`POST …/repost-ack`). */
export async function acknowledgeRepost(
  slug: string,
  soundId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(gatePath(slug, soundId, 'repost-ack'), {
      method: 'POST',
      body: JSON.stringify({ fp: listenerFingerprint() }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not record the share',
    };
  }
}
