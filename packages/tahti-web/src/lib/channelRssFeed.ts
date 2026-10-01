import { apiBase } from '../api/http';

/** Absolute URL of a channel's sound feed (`GET /api/v1/c/:slug/rss.xml`),
 * since it gets pasted into podcast apps outside Tahti. */
export function channelRssFeedUrl(slug: string): string {
  return new URL(
    `${apiBase()}/api/v1/c/${encodeURIComponent(slug)}/rss.xml`,
    window.location.origin,
  ).href;
}
