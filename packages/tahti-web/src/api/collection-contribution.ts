import type { CollectionItem } from './types';

/** Who added an item to a collection and why, as the public collection
 * payload passes them through. Absent on APIs that predate them. */
export type CollectionItemContribution = {
  addNote?: string | null;
  addedBy?: { username: string; displayName: string } | null;
};

export type ContributedCollectionItem = CollectionItem &
  CollectionItemContribution;

export type ContributionLine = {
  addedByUsername: string | null;
  note: string | null;
};

/** The owner's own additions aren't credited. Only the username is ever
 * shown, never `addedBy.displayName`, so an email can't surface as a name. */
export function contributionLine(
  item: ContributedCollectionItem,
  ownerUsername: string,
): ContributionLine | null {
  const username = item.addedBy?.username?.trim() || null;
  const addedByUsername =
    username && username !== ownerUsername ? username : null;
  const note = item.addNote?.trim() || null;
  if (!addedByUsername && !note) {
    return null;
  }
  return { addedByUsername, note };
}
