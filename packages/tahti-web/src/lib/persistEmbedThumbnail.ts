import { updateArtistEmbedThumbnail } from '../api/artist-embeds';

const persisted = new Set<string>();

export async function persistEmbedThumbnail(
  id: string,
  url: string,
): Promise<boolean> {
  if (persisted.has(id) || !url.startsWith('https://')) {
    return false;
  }
  persisted.add(id);
  const result = await updateArtistEmbedThumbnail(id, url);
  return result.ok;
}

export function resetPersistedEmbedThumbnails(): void {
  persisted.clear();
}
