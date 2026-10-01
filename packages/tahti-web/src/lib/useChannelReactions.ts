import { useEffect, useRef } from 'react';

import { fetchReactionsToken } from '../api/chat-reactions';
import { centrifugoWsUrl } from './centrifugoWsUrl';

/** Calls `onReaction` for every emoji anyone sends to the channel's live reactions. */
export function useChannelReactions(
  slug: string,
  onReaction: (emoji: string) => void,
) {
  const onReactionRef = useRef(onReaction);
  onReactionRef.current = onReaction;

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    const channel = `reactions:${slug}`;

    void fetchReactionsToken(slug).then((token) => {
      const url = centrifugoWsUrl();
      if (cancelled || !token || !url) {
        return;
      }
      let nextId = 1;
      try {
        ws = new WebSocket(url);
      } catch {
        return;
      }
      ws.onopen = () => {
        ws?.send(JSON.stringify({ id: nextId++, connect: { token } }));
      };
      ws.onmessage = (ev) => {
        for (const line of String(ev.data).split('\n')) {
          if (!line.trim()) {
            continue;
          }
          try {
            const msg = JSON.parse(line) as {
              connect?: unknown;
              push?: { channel?: string; pub?: { data?: { emoji?: string } } };
            };
            if (msg.connect) {
              ws?.send(
                JSON.stringify({ id: nextId++, subscribe: { channel } }),
              );
            }
            const emoji = msg.push?.pub?.data?.emoji;
            if (msg.push?.channel === channel && emoji) {
              onReactionRef.current(emoji);
            }
          } catch {
            continue;
          }
        }
      };
    });

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [slug]);
}
