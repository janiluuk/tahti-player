export type ExportClipOptions = {
  /** Wall-clock seconds to record. */
  durationSec: number;
  fps: number;
  /** Output frame height; width follows the source aspect ratio. */
  height: number;
  /** Target encode bitrate; keep low enough for the 10 MB header video limit. */
  videoBitsPerSecond: number;
  signal?: AbortSignal;
  onProgress?: (ratio: number) => void;
  /** Preferred MIME types in order. */
  mimeTypes?: readonly string[];
};

export type ExportClipResult = {
  file: File;
  mimeType: string;
};

const DEFAULT_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
] as const;

export function pickRecorderMimeType(
  candidates: readonly string[] = DEFAULT_MIME_TYPES,
): string | null {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

export function extensionForMime(mimeType: string): string {
  if (mimeType.includes('mp4')) {
    return 'mp4';
  }
  return 'webm';
}

/**
 * Records an already-animating canvas via an offscreen scaled canvas +
 * `captureStream` + MediaRecorder. Video-only (channel backdrops play muted);
 * keep bitrate/duration under `MAX_HEADER_VIDEO_BYTES` (10 MB).
 */
export async function exportVisualizerClip(
  sourceCanvas: HTMLCanvasElement,
  options: ExportClipOptions,
): Promise<ExportClipResult> {
  const mimeType = pickRecorderMimeType(options.mimeTypes);
  if (!mimeType) {
    throw new Error('This browser cannot record canvas video.');
  }
  if (options.signal?.aborted) {
    throw new DOMException('Export cancelled', 'AbortError');
  }

  const sourceWidth = Math.max(sourceCanvas.width, 1);
  const sourceHeight = Math.max(sourceCanvas.height, 1);
  const height = options.height;
  const width = Math.max(2, Math.round((height * sourceWidth) / sourceHeight));
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create an export canvas.');
  }

  let rafId = 0;
  const pump = () => {
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    rafId = window.requestAnimationFrame(pump);
  };
  pump();

  const stream = out.captureStream(options.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.videoBitsPerSecond,
  });
  const chunks: BlobPart[] = [];

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onerror = () => {
      reject(new Error('Video recording failed.'));
    };
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] ?? mimeType }));
    };
  });

  const startedAt = performance.now();
  const durationMs = options.durationSec * 1000;
  let progressTimer = 0;

  const tickProgress = () => {
    const ratio = Math.min(1, (performance.now() - startedAt) / durationMs);
    options.onProgress?.(ratio);
  };

  const cleanupStream = () => {
    window.cancelAnimationFrame(rafId);
    window.clearInterval(progressTimer);
    stream.getTracks().forEach((track) => track.stop());
  };

  const onAbort = () => {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    cleanupStream();
  };
  options.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    recorder.start(250);
    progressTimer = window.setInterval(tickProgress, 200);
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => resolve(), durationMs);
      options.signal?.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new DOMException('Export cancelled', 'AbortError'));
        },
        { once: true },
      );
    });
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    const blob = await stopped;
    options.onProgress?.(1);
    const ext = extensionForMime(mimeType);
    const file = new File([blob], `tahti-visualizer.${ext}`, {
      type: blob.type || mimeType.split(';')[0] || 'video/webm',
      lastModified: Date.now(),
    });
    return { file, mimeType };
  } finally {
    options.signal?.removeEventListener('abort', onAbort);
    cleanupStream();
  }
}

export const EXPORT_DURATION_OPTIONS = [5, 10, 15] as const;
export type ExportDurationSec = (typeof EXPORT_DURATION_OPTIONS)[number];

export const EXPORT_RESOLUTION_OPTIONS = [
  { id: '720', label: '720p', height: 720 },
  { id: '480', label: '480p', height: 480 },
] as const;
export type ExportResolutionId =
  (typeof EXPORT_RESOLUTION_OPTIONS)[number]['id'];

/** Bitrate targets that usually stay under the 10 MB header upload cap. */
export function bitrateForExport(
  durationSec: number,
  resolutionId: ExportResolutionId,
): number {
  const budgetBytes = 9 * 1024 * 1024;
  const bits = (budgetBytes * 8) / Math.max(durationSec, 1);
  const capped = resolutionId === '480' ? 2_500_000 : 4_000_000;
  return Math.min(Math.floor(bits * 0.85), capped);
}
