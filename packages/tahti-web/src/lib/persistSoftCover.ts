import { patchStudioSound } from '../api/studio';
import { useAuthStore } from '../stores/authStore';

const persisted = new Set<string>();

export function canPersistSoftCover(): boolean {
  const { user, profileLoaded } = useAuthStore.getState();
  return Boolean(user && profileLoaded && user.channel);
}

export async function persistSoftCover(
  soundId: string,
  url: string,
): Promise<boolean> {
  if (persisted.has(soundId) || !canPersistSoftCover()) {
    return false;
  }
  persisted.add(soundId);
  const result = await patchStudioSound(soundId, { bannerUrl: url });
  return result.ok;
}

export function resetPersistedSoftCovers(): void {
  persisted.clear();
}
