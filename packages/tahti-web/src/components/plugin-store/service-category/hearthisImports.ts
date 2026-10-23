const HEARTHIS_IMPORTS_STORAGE_KEY = 'tahti-web-hearthis-imports';

/** hearthis.at track ids this listener already imported, per account. */
export function readImportedIds(userId: string): Set<string> {
  if (typeof localStorage === 'undefined') {
    return new Set();
  }
  try {
    const stored = JSON.parse(
      localStorage.getItem(`${HEARTHIS_IMPORTS_STORAGE_KEY}:${userId}`) ?? '[]',
    ) as unknown;
    return new Set(
      Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === 'string')
        : [],
    );
  } catch {
    return new Set();
  }
}

export function writeImportedIds(userId: string, ids: Set<string>) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(
      `${HEARTHIS_IMPORTS_STORAGE_KEY}:${userId}`,
      JSON.stringify([...ids]),
    );
  } catch {
    // Storage full/blocked: the imported marks just won't survive a reload.
  }
}
