/** The still first frame of an animated avatar, or null. Ignored without an
 * `avatarUrl` so a poster left over from a removed GIF never stands in for
 * the placeholder artwork. */
export function avatarPoster(user: {
  avatarUrl?: string | null;
  avatarPosterUrl?: string | null;
}): string | null {
  return user.avatarUrl && user.avatarPosterUrl ? user.avatarPosterUrl : null;
}
