const SEPARATOR = /^\s*[—–-]\s*/;

/** A title that repeats its own artist ("Minh Nguyen — Acoustic Set" by
 * Minh Nguyen) reads as "Acoustic Set" where the artist shows beside it. */
export function titleWithoutArtist(title: string, artist: string): string {
  const name = artist.trim();
  if (!name || !title.toLowerCase().startsWith(name.toLowerCase())) {
    return title;
  }
  const rest = title.slice(name.length);
  if (!SEPARATOR.test(rest)) {
    return title;
  }
  const stripped = rest.replace(SEPARATOR, '').trim();
  return stripped || title;
}
