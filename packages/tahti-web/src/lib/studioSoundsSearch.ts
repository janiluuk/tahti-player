export type StudioSoundsSearch = {
  contentType?: string;
  folder?: string;
  tab?: 'embeds';
};

export function parseStudioSoundsSearch(
  search: Record<string, unknown>,
): StudioSoundsSearch {
  return {
    contentType:
      typeof search.contentType === 'string' ? search.contentType : undefined,
    folder: typeof search.folder === 'string' ? search.folder : undefined,
    tab: search.tab === 'embeds' ? 'embeds' : undefined,
  };
}
