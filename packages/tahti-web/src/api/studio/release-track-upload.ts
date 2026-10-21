import { putWithProgress, UploadAbortedError } from '../../lib/putWithProgress';
import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

export const RELEASE_TRACK_AUDIO_TYPES = [
  'audio/wav',
  'audio/flac',
  'audio/mpeg',
  'audio/aac',
  'audio/x-aiff',
];

/** True while the worker scans and transcodes a track's uploaded file. */
export function isReleaseTrackProcessing(status: string | undefined): boolean {
  return status === 'SCANNING' || status === 'TRANSCODING';
}

export type ReleaseTrackUploadResult =
  | { ok: true; sourceKey: string; status: 'SCANNING' }
  | { ok: false; cancelled: boolean; error: string };

const trackBase = (releaseId: string, trackId: string) =>
  `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}`;

function mockProgress(
  onProgress: ((fraction: number) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let fraction = 0;
    const timer = window.setInterval(() => {
      fraction = Math.min(1, fraction + 0.25);
      onProgress?.(fraction);
      if (fraction >= 1) {
        window.clearInterval(timer);
        resolve();
      }
    }, 150);
    signal?.addEventListener('abort', () => {
      window.clearInterval(timer);
      reject(new UploadAbortedError());
    });
  });
}

/** Upload a release track's source audio: presign, PUT straight to storage,
 * then finalize so the worker scans and transcodes it. */
export async function uploadReleaseTrackAudio(
  releaseId: string,
  trackId: string,
  file: File,
  options: {
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<ReleaseTrackUploadResult> {
  const contentType = file.type || 'audio/mpeg';
  if (!RELEASE_TRACK_AUDIO_TYPES.includes(contentType)) {
    return {
      ok: false,
      cancelled: false,
      error: 'Use WAV, FLAC, MP3, AAC or AIFF',
    };
  }
  try {
    if (isForceMock()) {
      await mockProgress(options.onProgress, options.signal);
      return { ok: true, sourceKey: `mock/${trackId}`, status: 'SCANNING' };
    }
    const { data: prep } = await requestJson<{
      uploadUrl: string;
      sourceKey: string;
    }>(`${trackBase(releaseId, trackId)}/upload`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType }),
      signal: options.signal,
    });
    await putWithProgress(prep.uploadUrl, file, {
      contentType,
      onProgress: options.onProgress,
      signal: options.signal,
    });
    await requestJson(`${trackBase(releaseId, trackId)}/finalize`, {
      method: 'POST',
      signal: options.signal,
    });
    return { ok: true, sourceKey: prep.sourceKey, status: 'SCANNING' };
  } catch (err) {
    const cancelled =
      err instanceof UploadAbortedError ||
      (err instanceof DOMException && err.name === 'AbortError') ||
      Boolean(options.signal?.aborted);
    return {
      ok: false,
      cancelled,
      error: cancelled
        ? 'Upload cancelled'
        : err instanceof Error
          ? err.message
          : 'Could not upload the audio',
    };
  }
}
