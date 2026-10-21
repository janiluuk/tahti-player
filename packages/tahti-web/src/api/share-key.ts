/** Appends a private-share key as `?key=` (or `&key=` if the path already
 * has a query string) - the one thing every track call needs to pass
 * through to let the backend recognize "this request is using a share
 * link for a PRIVATE/STASH sound, not normal public access" and (per the
 * share-link contract) serve it without a public visibility check, and
 * log the access/interaction to the audit log instead of fanning it out
 * as a normal public activity/notification event. */
export function withShareKey(
  path: string,
  shareKey: string | undefined,
): string {
  if (!shareKey) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}key=${encodeURIComponent(shareKey)}`;
}
