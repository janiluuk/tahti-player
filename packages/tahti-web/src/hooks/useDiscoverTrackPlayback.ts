import { useState } from 'react';

import { fetchTrackDetail } from '../api/client';
import type { DiscoverTrackItem } from '../api/types';
import { discoverTrackPlayable as toPlayable } from '../lib/discoverTrackPlayable';
import { usePlayerStore } from '../stores/playerStore';

function matchesCurrentTrack(
  currentId: string | null,
  itemId: string,
): boolean {
  if (!currentId) {
    return false;
  }
  if (currentId === itemId) {
    return true;
  }
  const bareId = itemId.replace(/^sound:/, '');
  return currentId === bareId || currentId === `sound:${bareId}`;
}

/** Play / pause / queue a Discover-style track item, fetching its audio URL
 * first when the list didn't include one. */
export function useDiscoverTrackPlayback(item: DiscoverTrackItem) {
  const play = usePlayerStore((state) => state.play);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const [loading, setLoading] = useState(false);
  const playable = toPlayable(item);
  const isCurrent = matchesCurrentTrack(currentId, item.id);
  const isPlaying = isCurrent && status === 'playing';

  const resolvePlayable = async () => {
    if (playable) {
      return playable;
    }
    setLoading(true);
    const result = await fetchTrackDetail(item.id.replace(/^sound:/, ''));
    setLoading(false);
    const detail = result.data;
    if (!detail?.audioUrl) {
      return null;
    }
    return {
      id: item.id,
      kind: 'sound' as const,
      title: detail.title,
      artist: detail.artistName,
      coverUrl: detail.bannerUrl ?? undefined,
      streamUrl: detail.audioUrl,
      protocol: detail.audioUrl.includes('.m3u8')
        ? ('hls' as const)
        : ('https' as const),
      channelSlug: detail.channelSlug,
      durationSec: detail.durationSec,
    };
  };

  const togglePlay = async () => {
    if (isCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    const next = await resolvePlayable();
    if (next) {
      play(next);
    }
  };

  const queue = async () => {
    const next = await resolvePlayable();
    if (next) {
      enqueue(next);
    }
  };

  return { isCurrent, isPlaying, loading, togglePlay, queue };
}
