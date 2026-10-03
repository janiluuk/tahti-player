/** Who added an item to a collection and why, as the public and owner
 * collection payloads pass them through. Absent on APIs that predate them. */
export type CollectionItemContribution = {
  addNote?: string | null;
  addedBy?: { username: string; displayName: string } | null;
};

/** Rows carrying a contribution line need room for a third text line. */
export const ANNOTATED_ROW_HEIGHT = 68;

export type ContributionLine = {
  addedByUsername: string | null;
  note: string | null;
};

/** The owner's own additions aren't credited. Only the username is ever
 * shown, never `addedBy.displayName`, so an email can't surface as a name. */
export function contributionLine(
  item: CollectionItemContribution & { position: number },
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
