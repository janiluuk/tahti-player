import { create } from 'zustand';

import { fetchMyLikes } from '../api/likes';
import { setSoundLiked } from '../api/sound-likes';

type SoundLikesState = {
  /** Sound ids the signed-in listener liked, loaded once per sign-in. */
  liked: Set<string>;
  /** Public counts after this listener changed them, by sound id. */
  counts: Record<string, number>;
  loadedFor: string | null;
  load: (userId: string) => Promise<void>;
  toggle: (
    channelSlug: string,
    soundId: string,
    currentCount: number,
  ) => Promise<string | null>;
  reset: () => void;
};

export const useSoundLikesStore = create<SoundLikesState>((set, get) => ({
  liked: new Set(),
  counts: {},
  loadedFor: null,
  load: async (userId) => {
    if (get().loadedFor === userId) {
      return;
    }
    set({ loadedFor: userId });
    const result = await fetchMyLikes();
    set({ liked: new Set(result.data.map((track) => track.id)) });
  },
  toggle: async (channelSlug, soundId, currentCount) => {
    const wasLiked = get().liked.has(soundId);
    const result = await setSoundLiked(
      channelSlug,
      soundId,
      !wasLiked,
      currentCount,
    );
    if (!result.ok) {
      return result.error;
    }
    const liked = new Set(get().liked);
    if (result.data.liked) {
      liked.add(soundId);
    } else {
      liked.delete(soundId);
    }
    set({
      liked,
      counts: { ...get().counts, [soundId]: result.data.likeCount },
    });
    return null;
  },
  reset: () => set({ liked: new Set(), counts: {}, loadedFor: null }),
}));
