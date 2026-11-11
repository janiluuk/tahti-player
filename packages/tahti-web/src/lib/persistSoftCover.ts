import { patchStudioSound } from '../api/studio';

const persisted = new Set<string>();

export async function persistSoftCover(
  soundId: string,
  url: string,
): Promise<boolean> {
  if (persisted.has(soundId)) {
    return false;
  }
  persisted.add(soundId);
  const result = await patchStudioSound(soundId, { bannerUrl: url });
  return result.ok;
}

export function resetPersistedSoftCovers(): void {
  persisted.clear();
}
