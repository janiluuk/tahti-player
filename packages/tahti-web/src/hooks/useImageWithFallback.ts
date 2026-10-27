import { useEffect, useState } from 'react';

/** The image URL to show: `primary` once it loads, `fallback` when it is
 * missing or fails (a third-party logo that disappeared, say). */
export function useImageWithFallback(
  primary: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!primary || !fallback || typeof Image === 'undefined') {
      return;
    }
    let cancelled = false;
    const probe = new Image();
    probe.onerror = () => {
      if (!cancelled) {
        setFailed(primary);
      }
    };
    probe.src = primary;
    return () => {
      cancelled = true;
    };
  }, [primary, fallback]);

  if (!primary || failed === primary) {
    return fallback ?? null;
  }
  return primary;
}
