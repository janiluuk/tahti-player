import { apiBase } from './http';
import { isForceMock } from './mode';

/** Count a click from a smart link page through to a streaming service, for
 * the artist's smart-link stats. Fire-and-forget: `keepalive` lets it finish
 * while the service opens, and a failure never blocks the listener. */
export function recordSmartLinkClick(
  smartLinkSlug: string,
  platform: string,
): void {
  if (isForceMock()) {
    return;
  }
  const referer =
    typeof document !== 'undefined' && document.referrer
      ? document.referrer.slice(0, 2000)
      : undefined;
  void fetch(`${apiBase()}/api/smartlink/click`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smartLinkSlug,
      platform: platform.toLowerCase().slice(0, 32),
      ...(referer ? { referer } : {}),
    }),
  }).catch(() => undefined);
}
