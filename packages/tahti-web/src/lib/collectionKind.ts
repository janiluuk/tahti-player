import type { PublicProfileCollection } from '../api/types';

export type CollectionKind = 'album' | 'dj-set' | 'other';

type KindFields = Pick<PublicProfileCollection, 'type' | 'style'> &
  Partial<Pick<PublicProfileCollection, 'name'>>;

const ALBUM_STYLES = new Set(['ALBUM', 'EP', 'SINGLE']);
const DJ_SET_NAME = /^sets?\b/i;
const ALBUM_NAME = /\b(LP|EP|album)\b/i;

/** Which artist-page tab a collection belongs on. The type or style decides
 * when it says album / EP / single or mix / DJ set series; a generic playlist
 * falls back to its name: "Set…" is a DJ set, one naming an LP, EP or album
 * is an album, anything else stays in the playlists grid. */
export function collectionKind(collection: KindFields): CollectionKind {
  const type = collection.type?.toUpperCase();
  const style = collection.style?.toUpperCase();
  if (type === 'MIX_SERIES' || style === 'DJ_SET_SERIES') {
    return 'dj-set';
  }
  if (type === 'ALBUM' || (style && ALBUM_STYLES.has(style))) {
    return 'album';
  }
  const name = collection.name?.trim() ?? '';
  if (DJ_SET_NAME.test(name)) {
    return 'dj-set';
  }
  if (ALBUM_NAME.test(name)) {
    return 'album';
  }
  return 'other';
}

export function collectionsOfKind<T extends KindFields>(
  collections: T[],
  kind: CollectionKind,
): T[] {
  return collections.filter(
    (collection) => collectionKind(collection) === kind,
  );
}
