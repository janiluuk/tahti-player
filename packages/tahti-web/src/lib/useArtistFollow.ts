import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { fetchFollowStatus } from '../api/follows';
import { useLibraryStore, type FavoriteChannel } from '../stores/libraryStore';

export function useArtistFollow(
  channel: (FavoriteChannel & { username: string }) | null,
  enabled: boolean,
) {
  const channelRef = useRef(channel);
  channelRef.current = channel;
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const slug = channel?.slug ?? null;
  const username = channel?.username ?? null;
  const following = useLibraryStore((s) =>
    slug ? s.favoriteChannels.some((c) => c.slug === slug) : false,
  );

  useEffect(() => {
    if (!enabled || !username) {
      return;
    }
    let cancelled = false;
    void fetchFollowStatus(username).then((status) => {
      const current = channelRef.current;
      if (cancelled || !status || !current) {
        return;
      }
      useLibraryStore.getState().setFavoriteChannel(current, status.following);
      if (status.followerCount != null) {
        setFollowerCount(status.followerCount);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, username, slug]);

  const toggle = async () => {
    const current = channelRef.current;
    if (!current || busy) {
      return;
    }
    setBusy(true);
    const result = await useLibraryStore
      .getState()
      .toggleFavoriteChannel(current);
    setBusy(false);
    if (!result) {
      return;
    }
    if (!result.ok) {
      toast.error(
        following
          ? `Couldn't unfollow ${current.displayName}: ${result.error}`
          : `Couldn't follow ${current.displayName}: ${result.error}`,
      );
      return;
    }
    if (result.followerCount != null) {
      setFollowerCount(result.followerCount);
    }
  };

  return { following, followerCount, busy, toggle };
}
