type HlsModule = typeof import('hls.js');

const HLS_MIME = 'application/vnd.apple.mpegurl';
const IDLE_TIMEOUT_MS = 5000;
const IDLE_FALLBACK_DELAY_MS = 3000;

let hlsModule: Promise<HlsModule> | null = null;
let idlePrefetchScheduled = false;

/** hls.js is most of a megabyte, so it loads on the first HLS stream (or an
 * idle / intent prefetch) instead of with the app shell. */
export function loadHls(): Promise<HlsModule> {
  hlsModule ??= import('hls.js').catch((error: unknown) => {
    hlsModule = null;
    throw error;
  });
  return hlsModule;
}

/**
 * WebKit AirPlays a media element's own output. Once `createMediaElementSource`
 * captures the element, its sound only leaves through the AudioContext, so the
 * AirPlay receiver plays silence, and a capture can't be undone. Browsers that
 * can AirPlay therefore play uncaptured (visualizers fall back to idle).
 */
export function canAirPlay(): boolean {
  return (
    typeof window !== 'undefined' &&
    'WebKitPlaybackTargetAvailabilityEvent' in window
  );
}

/** AirPlay can't cast a MediaSource-backed element, so AirPlay-capable
 * browsers play HLS natively whenever they can. */
export function prefersNativeHls(audio: Pick<HTMLMediaElement, 'canPlayType'>) {
  return canAirPlay() && audio.canPlayType(HLS_MIME) !== '';
}

export function isHlsStream(playable: {
  protocol?: string | null;
  streamUrl?: string | null;
}): boolean {
  return (
    playable.protocol === 'hls' ||
    (playable.streamUrl?.includes('.m3u8') ?? false)
  );
}

function saveDataEnabled(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return connection?.saveData === true;
}

function shouldPrefetchHls(): boolean {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  if (saveDataEnabled()) {
    return false;
  }
  return !prefersNativeHls(document.createElement('audio'));
}

/** Warms the hls.js chunk ahead of an HLS play; a no-op where it would never
 * be used or the user asked to save data. */
export function prefetchHls(): void {
  if (hlsModule || !shouldPrefetchHls()) {
    return;
  }
  void loadHls().catch(() => undefined);
}

/** Schedules one prefetch for when the browser is idle after startup.
 * Returns a cancel function. */
export function scheduleIdleHlsPrefetch(): () => void {
  if (idlePrefetchScheduled || typeof window === 'undefined') {
    return () => undefined;
  }
  idlePrefetchScheduled = true;
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(prefetchHls, {
      timeout: IDLE_TIMEOUT_MS,
    });
    return () => {
      window.cancelIdleCallback(handle);
      idlePrefetchScheduled = false;
    };
  }
  const handle = window.setTimeout(prefetchHls, IDLE_FALLBACK_DELAY_MS);
  return () => {
    window.clearTimeout(handle);
    idlePrefetchScheduled = false;
  };
}
