import { toast } from 'sonner';

import { fetchEditorSource } from '../../../api/studio';
import type {
  StudioCollectionItem,
  StudioSound,
} from '../../../api/studio-types';
import type { TahtiPlayable } from '../../../api/types';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import { usePlayerStore } from '../../../stores/playerStore';

/** Playback of a collection's sounds (play, queue, toggle the current one). */
export function useCollectionPlayback(items: StudioCollectionItem[]) {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const isPlaying = status === 'playing' || status === 'loading';

  type PlayableSound = {
    id: string;
    title: string;
    artistName?: string | null;
    bannerUrl?: string | null;
    embedProvider?: string | null;
    embedUri?: string | null;
    durationSec?: number | null;
  };

  /** Non-hearthis EMBED_ONLY sounds have no Tahti-hosted audio and no
   * shared-player widget to build a playable from. */
  const buildPlayable = async (
    sound: PlayableSound,
  ): Promise<TahtiPlayable | null> => {
    const hearthis = playableFromStudioHearthis(sound);
    if (hearthis) {
      return hearthis;
    }
    if (sound.embedProvider && sound.embedProvider !== 'HEARTHIS') {
      return null;
    }
    const { data } = await fetchEditorSource(sound.id);
    return {
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: data.title || sound.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    };
  };

  const playSound = async (sound: PlayableSound) => {
    const playable = await buildPlayable(sound);
    if (playable) {
      play(playable);
    }
  };

  const playAllTracks = async () => {
    const first = items.find((item) => item.sound);
    if (!first?.sound) {
      return;
    }
    await playSound(first.sound);
  };

  const queueAllTracks = async () => {
    const withSound = items.filter(
      (item): item is StudioCollectionItem & { sound: StudioSound } =>
        Boolean(item.sound),
    );
    // Resolve all sources in parallel, then queue in the tracklist order.
    const resolved = await Promise.all(
      withSound.map((item) => buildPlayable(item.sound).catch(() => null)),
    );
    let queued = 0;
    for (const playable of resolved) {
      if (playable) {
        enqueue(playable);
        queued += 1;
      }
    }
    if (queued === 0) {
      toast.info('No playable tracks to queue.');
    } else {
      toast.success(
        `Added ${queued} track${queued === 1 ? '' : 's'} to the queue.`,
      );
    }
  };

  const togglePlayItem = (item: StudioCollectionItem) => {
    // Non-hearthis EMBED_ONLY items have no Tahti-hosted audio and no
    // shared-player widget — only HEARTHIS plays via the bottom bar.
    if (
      !item.sound ||
      (item.sound.embedProvider && item.sound.embedProvider !== 'HEARTHIS')
    ) {
      return;
    }
    const isThisCurrent = currentId === `sound:${item.sound.id}`;
    if (isThisCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    void playSound(item.sound);
  };

  return {
    queue,
    enqueue,
    setStatus,
    buildPlayable,
    currentId,
    isPlaying,
    playSound,
    playAllTracks,
    queueAllTracks,
    togglePlayItem,
  };
}
