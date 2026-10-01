import type { StudioCollection } from '../api/studio-types';

/** Public collections in the order the artist page shows them: featured
 * first, then the saved order, then newest. */
export function publicCollectionsInProfileOrder(
  collections: StudioCollection[],
): StudioCollection[] {
  return collections
    .filter((c) => c.isPublic !== false && c.visibility !== 'PRIVATE')
    .sort(
      (a, b) =>
        Number(b.isFeatured ?? false) - Number(a.isFeatured ?? false) ||
        (a.publicProfileOrder ?? 0) - (b.publicProfileOrder ?? 0) ||
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    );
}
