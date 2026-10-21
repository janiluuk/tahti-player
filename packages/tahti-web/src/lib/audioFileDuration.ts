export const MAX_ANNOUNCEMENT_DURATION_SEC = 600;

export function announcementDurationSec(
  duration: number | undefined,
): number | undefined {
  if (duration === undefined || !Number.isFinite(duration) || duration <= 0) {
    return undefined;
  }
  const rounded = Math.round(duration);
  return rounded <= MAX_ANNOUNCEMENT_DURATION_SEC ? rounded : undefined;
}

export function readAudioFileDuration(
  file: Blob,
  timeoutMs = 5000,
): Promise<number | undefined> {
  if (
    typeof Audio === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;
    const finish = (value: number | undefined) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      audio.removeAttribute('src');
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => finish(undefined), timeoutMs);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => finish(audio.duration));
    audio.addEventListener('error', () => finish(undefined));
    audio.src = url;
  });
}
