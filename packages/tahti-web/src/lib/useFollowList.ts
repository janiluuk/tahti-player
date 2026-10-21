import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchFollowList, type FollowListDirection } from '../api/follows';
import type { FollowListUser } from '../api/types';

export function useFollowList(
  username: string,
  direction: FollowListDirection | null,
) {
  const [users, setUsers] = useState<FollowListUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const request = useRef(0);

  const load = useCallback(
    async (offset: number) => {
      if (!direction) {
        return;
      }
      const id = ++request.current;
      setLoading(true);
      setError(false);
      const page = await fetchFollowList(username, direction, offset);
      if (id !== request.current) {
        return;
      }
      setLoading(false);
      if (!page) {
        setError(true);
        return;
      }
      setUsers((current) => {
        const seen = new Set(current.map((u) => u.username));
        return [...current, ...page.users.filter((u) => !seen.has(u.username))];
      });
      setHasMore(page.hasMore);
    },
    [username, direction],
  );

  useEffect(() => {
    request.current += 1;
    setUsers([]);
    setHasMore(false);
    setError(false);
    if (direction) {
      void load(0);
    }
  }, [direction, load]);

  const loadMore = () => void load(users.length);

  return { users, loading, error, hasMore, loadMore };
}
