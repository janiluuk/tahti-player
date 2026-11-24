import { fetchTrackDetail } from '../api/client';

/** Presigned storage URLs (S3 / R2 query signatures) expire, typically after
 * an hour, while queue, favorites and history keep them much longer. */
export function isSignedStorageUrl(url: string): boolean {
  return /[?&]X-Amz-Signature=/i.test(url);
}

/** A fresh stream URL for a Tahti sound, or null when the API has none (the
 * track is gated, gone, or the request failed). */
export async function freshSoundStreamUrl(
  soundId: string,
): Promise<string | null> {
  try {
    const { data } = await fetchTrackDetail(soundId);
    return data?.audioUrl ?? null;
  } catch {
    return null;
  }
}
