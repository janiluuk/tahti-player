import { useRouter } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import {
  fetchChannel,
  fetchProfile,
  fetchTrackComments,
  fetchTrackDetail,
} from '../../api/client';
import { listMockCommerceFanSubs } from '../../api/mock-commerce-ledger';
import { listMockSubscriptions } from '../../api/mock-session';
import { isForceMock } from '../../api/mode';
import { mockOwnsPurchaseTier } from '../../api/purchase-tiers';
import {
  type PublicChannel,
  type PublicProfile,
  type PublicTrackDetail,
  type TrackComment,
} from '../../api/types';
import { parsePublicTracklist } from '../../lib/publicTracklist';
import { useDominantColor } from '../../lib/useDominantColor';
import { useAuthStore } from '../../stores/authStore';
import { useLibraryStore } from '../../stores/libraryStore';
import {
  playableFromQueueItem,
  usePlayerStore,
} from '../../stores/playerStore';
import { useTrackDetailStore } from '../../stores/trackDetailStore';
import { playableFromDetail } from './helpers';

export function useTrackDetail(id: string, shareKey?: string) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const playableId = `sound:${id}`;
  const remembered = useTrackDetailStore((s) => s.cache[playableId]);
  const queueItem = usePlayerStore((s) =>
    s.queue.find((q) => q.id === playableId),
  );
  const fastPath =
    remembered ?? (queueItem ? playableFromQueueItem(queueItem) : null);

  const [detail, setDetail] = useState<PublicTrackDetail | null>(null);
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);
  const [pwywOpen, setPwywOpen] = useState(false);
  const [pwywAmt, setPwywAmt] = useState('');
  const [purchaseBump, setPurchaseBump] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const reloadDetail = () => {
    void fetchTrackDetail(id, shareKey).then(({ data }) => {
      setDetail(data);
    });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTrackDetail(id, shareKey).then(({ data }) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
        if (data) {
          void fetchChannel(data.channelSlug).then((result) =>
            setChannel(result.data),
          );
          void fetchProfile(data.channel.username).then((result) =>
            setProfile(result.data),
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, shareKey]);

  useEffect(() => {
    let cancelled = false;
    void fetchTrackComments(id, shareKey).then((result) => {
      if (!cancelled) {
        setComments(result.data.comments);
        setCommentsEnabled(result.data.commentsEnabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, shareKey]);

  const play = usePlayerStore((s) => s.play);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);

  const playable = detail ? playableFromDetail(id, detail) : fastPath;
  const rgb = useDominantColor(playable?.coverUrl);
  const tracklist = useMemo(
    () => parsePublicTracklist(detail?.tracklist),
    [detail?.tracklist],
  );
  const purchaseEntitled = useMemo(() => {
    if (!detail || detail.accessMode !== 'PURCHASE' || !detail.purchaseTierId) {
      return true;
    }
    if (user?.username === detail.channel.username) {
      return true;
    }
    if (!isForceMock()) {
      return false;
    }
    const subscribedInSession = listMockSubscriptions().some(
      (row) =>
        row.artist.username === detail.channel.username &&
        row.state === 'ACTIVE',
    );
    const subscribedInLedger = listMockCommerceFanSubs().some(
      (sub) =>
        Boolean(user?.username) &&
        sub.fanUsername === user?.username &&
        sub.artistUsername === detail.channel.username,
    );
    if (subscribedInSession || subscribedInLedger) {
      return true;
    }
    return mockOwnsPurchaseTier(detail.purchaseTierId);
  }, [detail, user?.id, user?.username, purchaseBump]);

  return {
    id,
    shareKey,
    router,
    user,
    playableId,
    remembered,
    queueItem,
    fastPath,
    detail,
    setDetail,
    channel,
    setChannel,
    profile,
    setProfile,
    comments,
    setComments,
    commentsEnabled,
    setCommentsEnabled,
    commentBody,
    setCommentBody,
    commentBusy,
    setCommentBusy,
    commentError,
    setCommentError,
    commentComposerOpen,
    setCommentComposerOpen,
    loading,
    setLoading,
    playlistOpen,
    setPlaylistOpen,
    downloadBusy,
    setDownloadBusy,
    buyBusy,
    setBuyBusy,
    pwywOpen,
    setPwywOpen,
    pwywAmt,
    setPwywAmt,
    purchaseBump,
    setPurchaseBump,
    editOpen,
    setEditOpen,
    reloadDetail,
    play,
    setStatus,
    seekTo,
    currentId,
    status,
    currentTime,
    duration,
    toggleFavoriteTrack,
    favoriteTracks,
    playable,
    rgb,
    tracklist,
    purchaseEntitled,
  };
}

export type TrackDetailState = ReturnType<typeof useTrackDetail>;
