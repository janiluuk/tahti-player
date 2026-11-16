/** What Library → Files lists: uploaded media, the stash, or (desktop) the
 * local library. */
export const LIBRARY_FILE_KINDS = ['media', 'stash', 'local'] as const;
export type LibraryFileKind = (typeof LIBRARY_FILE_KINDS)[number];

export const isLibraryFileKind = (value: unknown): value is LibraryFileKind =>
  (LIBRARY_FILE_KINDS as readonly unknown[]).includes(value);
