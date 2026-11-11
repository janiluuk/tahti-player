import { create } from 'zustand';

import { fetchTrackDetail } from '../api/client';
import { fetchMyLikes } from '../api/likes';
import { setSoundEngagement } from '../api/sound-engagement';

type SoundLikesState = {
  /** Sound ids the signed-in listener liked, loaded once per sign-in. */
  liked: Set<string>;
  /** Public counts after this listener changed them, by sound id. */
  counts: Record<string, number>;
  loadedFor: string | null;
  /** Bumped when likes were added in bulk (the local favourites move), so
   * lists fetched before it can load again. */
  importedAt: number;
  markImported: () => void;
  load: (userId: string) => Promise<void>;
  /** Likes or unlikes a sound on the account. Without `channelSlug` the
   * owning channel is looked up first. Resolves to an error message, or
   * null when it worked. */
  setLike: (
    soundId: string,
    liked: boolean,
    channelSlug?: string,
  ) => Promise<string | null>;
  toggle: (channelSlug: string, soundId: string) => Promise<string | null>;
  /** Records a like state read elsewhere (a track page's own lookup), which
   * covers likes older than the first page of `/api/me/likes`. */
  remember: (soundId: string, liked: boolean) => void;
  reset: () => void;
};

async function channelSlugForSound(soundId: string): Promise<string | null> {
  const { data } = await fetchTrackDetail(soundId);
  return data?.channelSlug ?? null;
}

export const useSoundLikesStore = create<SoundLikesState>((set, get) => ({
  liked: new Set(),
  counts: {},
  loadedFor: null,
  importedAt: 0,
  markImported: () => set({ importedAt: Date.now() }),
  load: async (userId) => {
    if (get().loadedFor === userId) {
      return;
    }
    set({ loadedFor: userId });
    const result = await fetchMyLikes();
    set((s) => ({
      liked: new Set([...s.liked, ...result.data.map((track) => track.id)]),
    }));
  },
  setLike: async (soundId, active, channelSlug) => {
    const slug = channelSlug ?? (await channelSlugForSound(soundId));
    if (!slug) {
      return 'Could not find this track';
    }
    const result = await setSoundEngagement('like', slug, soundId, active);
    if (!result.ok) {
      return result.error;
    }
    const liked = new Set(get().liked);
    if (result.data.active) {
      liked.add(soundId);
    } else {
      liked.delete(soundId);
    }
    set({
      liked,
      counts: { ...get().counts, [soundId]: result.data.count },
    });
    return null;
  },
  toggle: (channelSlug, soundId) =>
    get().setLike(soundId, !get().liked.has(soundId), channelSlug),
  remember: (soundId, liked) => {
    if (get().liked.has(soundId) === liked) {
      return;
    }
    const next = new Set(get().liked);
    if (liked) {
      next.add(soundId);
    } else {
      next.delete(soundId);
    }
    set({ liked: next });
  },
  reset: () => set({ liked: new Set(), counts: {}, loadedFor: null }),
}));
