import { UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchChatDailyListeners } from '../api/chat-daily-listeners';

const REFRESH_MS = 60_000;

/** Distinct listeners so far today (UTC), unless the artist turned it off. */
export function ChatDailyListeners({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void fetchChatDailyListeners(slug).then((result) => {
        if (!cancelled) {
          setCount(
            result.data?.enabled && (result.data.count ?? 0) > 0
              ? result.data.count
              : null,
          );
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
    <div
      className="text-foreground-secondary flex items-center gap-1 text-xs"
      data-testid="chat-daily-listeners"
    >
      <UsersIcon size={12} aria-hidden />
      {count.toLocaleString()} {count === 1 ? 'listener' : 'listeners'} today
    </div>
  );
}
