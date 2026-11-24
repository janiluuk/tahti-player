import type { PublicProfileCollection } from '../api/types';

export type CollectionKind = 'album' | 'dj-set' | 'other';

const ALBUM_STYLES = new Set(['ALBUM', 'EP', 'SINGLE']);

/** Which artist-page tab a collection belongs on: albums (album type or an
 * album / EP / single style), DJ sets (mix series or DJ set series style), or
 * the general playlists grid. */
export function collectionKind(
  collection: Pick<PublicProfileCollection, 'type' | 'style'>,
): CollectionKind {
  const type = collection.type?.toUpperCase();
  const style = collection.style?.toUpperCase();
  if (type === 'MIX_SERIES' || style === 'DJ_SET_SERIES') {
    return 'dj-set';
  }
  if (type === 'ALBUM' || (style && ALBUM_STYLES.has(style))) {
    return 'album';
  }
  return 'other';
}

export function collectionsOfKind<
  T extends Pick<PublicProfileCollection, 'type' | 'style'>,
>(collections: T[], kind: CollectionKind): T[] {
  return collections.filter(
    (collection) => collectionKind(collection) === kind,
  );
}
