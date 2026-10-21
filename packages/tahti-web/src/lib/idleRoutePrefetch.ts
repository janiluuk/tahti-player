const IDLE_TIMEOUT_MS = 5000;
const IDLE_FALLBACK_DELAY_MS = 3000;

let idlePrefetchScheduled = false;

function saveDataEnabled(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return connection?.saveData === true;
}

export function prefetchCommonRoutes(): void {
  if (typeof navigator !== 'undefined' && saveDataEnabled()) {
    return;
  }
  void import('../views/studio/StudioHomeView');
  void import('../views/LibraryView');
  void import('../views/RadioView');
}

export function scheduleIdleRoutePrefetch(): () => void {
  if (idlePrefetchScheduled || typeof window === 'undefined') {
    return () => undefined;
  }
  idlePrefetchScheduled = true;
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(prefetchCommonRoutes, {
      timeout: IDLE_TIMEOUT_MS,
    });
    return () => {
      window.cancelIdleCallback(handle);
      idlePrefetchScheduled = false;
    };
  }
  const handle = window.setTimeout(
    prefetchCommonRoutes,
    IDLE_FALLBACK_DELAY_MS,
  );
  return () => {
    window.clearTimeout(handle);
    idlePrefetchScheduled = false;
  };
}
