import type { TFunction } from '@tahti-player/i18n';

import type { StudioCollection } from '../../api/studio-types';

/** Plural tab labels for the collection type filter. Separate keys, since
 * the plural can't be built from the singular in Finnish ("Albumit", not
 * "Albumis"). */
export const COLLECTION_TAB_KEYS = {
  ALBUM: 'library.collectionTabs.albums',
  EP: 'library.collectionTabs.eps',
  PLAYLIST: 'library.collectionTabs.playlists',
  DJ_SET_SERIES: 'library.collectionTabs.djSets',
  PODCAST: 'library.collectionTabs.podcasts',
  SERIES: 'library.collectionTabs.showSeries',
} as const;

const VISIBILITY_KEYS = {
  PUBLIC: 'library.collectionVisibility.public',
  UNLISTED: 'library.collectionVisibility.unlisted',
  PRIVATE: 'library.collectionVisibility.private',
  STASH: 'library.collectionVisibility.stash',
} as const;

/** "/short-signals, EP, 2 items, public" under a collection row. */
export function collectionRowMeta(
  collection: StudioCollection,
  styleLabel: string,
  t: TFunction<'web'>,
): string {
  const parts = [`/${collection.slug}`, styleLabel];
  if (collection.releaseDate) {
    parts.push(
      t('library.collectionReleases', { date: collection.releaseDate }),
    );
  }
  if (collection.genres?.length) {
    parts.push(collection.genres.join(', '));
  }
  const itemCount = collection.itemCount ?? collection.items?.length;
  if (typeof itemCount === 'number') {
    parts.push(t('library.collectionItems', { count: itemCount }));
  }
  const visibility =
    collection.visibility ??
    (collection.isPublic === false ? 'PRIVATE' : 'PUBLIC');
  parts.push(t(VISIBILITY_KEYS[visibility]));
  return parts.join(', ');
}
