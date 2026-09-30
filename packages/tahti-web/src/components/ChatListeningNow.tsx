import { useEffect, useState } from 'react';

import { fetchChannelPresence } from '../api/channel-presence';

const REFRESH_MS = 30_000;

/** How many people have the channel open right now, while it is live. */
export function ChatListeningNow({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void fetchChannelPresence(slug).then((result) => {
        if (!cancelled) {
          setCount(result && result > 0 ? result : null);
        }
      });
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [slug]);

  if (count === null) {
    return null;
  }

  return (
    <span data-testid="chat-listening-now">
      · {count.toLocaleString()} listening
    </span>
  );
}
