import { useEffect, useRef } from 'react';

import { channelToPlayable } from '../api/mock';
import type { PublicChannel } from '../api/types';
import { channelAutoplayAction } from '../lib/channelAutoplay';
import { usePlaybackPrefsStore } from '../stores/playbackPrefsStore';
import { usePlayerStore } from '../stores/playerStore';

/** Starts the channel on its own, once per visit to its page, when its
 * artist and the listener allow it (PLAT-086). `enabled` is off while the
 * page is being edited. */
export function useChannelAutoplay(
  channel: PublicChannel | null,
  enabled: boolean,
) {
  const handled = useRef<string | null>(null);
  const slug = channel?.slug ?? null;

  useEffect(() => {
    if (!channel || !slug || !enabled || handled.current === slug) {
      return;
    }
    handled.current = slug;
    const playable = channelToPlayable(channel);
    const { status, currentId, hasPlayed, autoplayMuted, fadeOverTo } =
      usePlayerStore.getState();
    const action = channelAutoplayAction({
      channel,
      playable,
      listenerAllows: usePlaybackPrefsStore.getState().channelAutoplay,
      player: { status, currentId, hasPlayed },
    });
    if (action === 'muted' && playable) {
      autoplayMuted(playable);
    }
    if (action === 'fade' && playable) {
      void fadeOverTo(playable);
    }
  }, [channel, slug, enabled]);
}
