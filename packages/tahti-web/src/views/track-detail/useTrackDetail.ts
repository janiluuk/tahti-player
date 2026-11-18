import { useRouter } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchChannel,
  fetchProfile,
  fetchTrackComments,
  fetchTrackDetail,
} from '../../api/client';
import { listMockCommerceFanSubs } from '../../api/mock-commerce-ledger';
import { listMockSubscriptions } from '../../api/mock-session';
import { FORCE_MOCK } from '../../api/mode';
import { mockOwnsPurchaseTier } from '../../api/purchase-tiers';
import type { DownloadGateStatus } from '../../api/sound-download-gates';
import { fetchStudioSound } from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import {
  type PublicChannel,
  type PublicProfile,
  type PublicTrackDetail,
  type TahtiPlayable,
  type TrackComment,
} from '../../api/types';
import { parsePublicTracklist } from '../../lib/publicTracklist';
import { syncDocumentMetadata } from '../../lib/seo';
import { useDominantColor } from '../../lib/useDominantColor';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { useAuthStore } from '../../stores/authStore';
import {
  playableFromQueueItem,
  usePlayerStore,
} from '../../stores/playerStore';
import { useTrackDetailStore } from '../../stores/trackDetailStore';
import { playableFromDetail } from './helpers';

const PROCESSING_POLL_MS = 15_000;

function isProcessing(sound: StudioSound): boolean {
  return (
    !sound.embedProvider &&
    (sound.status === 'PENDING' || sound.status === 'PROCESSING')
  );
}

/** The owner's view of an upload the public track API does not serve yet:
 * no stream, so the page shows the processing state instead of a player. */
function processingPlayable(sound: StudioSound, artist: string): TahtiPlayable {
  return {
    id: `sound:${sound.id}`,
    kind: 'sound',
    title: sound.title,
    artist,
    coverUrl: sound.bannerUrl ?? undefined,
    streamUrl: '',
    protocol: 'https',
    durationSec: sound.durationSec ?? undefined,
  };
}

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

  const {
    data: detail,
    loading,
    error: loadError,
    retry: retryLoad,
    mutate,
  } = useSnapshotFetch<PublicTrackDetail | null>(
    `track:${id}:${shareKey ?? ''}`,
    async () => {
      const result = await fetchTrackDetail(id, shareKey);
      // The API answers 404 for a missing, private or still-processing
      // track: that is "not found", not a failed load to retry.
      return result.meta.reason?.endsWith('→ 404') ? null : apiResult(result);
    },
  );
  const setDetail = (next: PublicTrackDetail | null) => mutate(() => next);
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadGates, setDownloadGates] = useState<DownloadGateStatus | null>(
    null,
  );
  const [buyBusy, setBuyBusy] = useState(false);
  const [pwywOpen, setPwywOpen] = useState(false);
  const [pwywAmt, setPwywAmt] = useState('');
  const [purchaseBump, setPurchaseBump] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  // The public track API 404s until an upload is READY. For the owner, a
  // missing track that Studio still lists as processing opens the track page
  // with a processing state and checks again until it is ready.
  const viewerId = user?.id ?? null;
  const missing = !loading && !loadError && detail === null;
  const [processingSound, setProcessingSound] = useState<StudioSound | null>(
    null,
  );
  useEffect(() => {
    setProcessingSound(null);
  }, [id, viewerId]);
  useEffect(() => {
    if (!missing || !viewerId) {
      return;
    }
    let cancelled = false;
    fetchStudioSound(id)
      .then((result) => {
        if (cancelled) {
          return;
        }
        const usable = result.meta.source === 'api' || FORCE_MOCK;
        setProcessingSound(
          usable && isProcessing(result.data) ? result.data : null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setProcessingSound(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [missing, viewerId, id]);
  const processing = detail ? null : processingSound;
  const retryLoadRef = useRef(retryLoad);
  retryLoadRef.current = retryLoad;
  useEffect(() => {
    if (!processing) {
      return;
    }
    const timer = window.setInterval(
      () => retryLoadRef.current(),
      PROCESSING_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [processing]);

  const channelSlug = detail?.channelSlug;
  const artistUsername = detail?.channel.username;

  useEffect(() => {
    if (!detail) {
      return;
    }
    syncDocumentMetadata(window.location.pathname, {
      title: `${detail.title} by ${detail.artistName} on Tahti`,
      image: detail.bannerUrl ?? undefined,
    });
  }, [detail?.title, detail?.artistName, detail?.bannerUrl]);

  useEffect(() => {
    if (!channelSlug) {
      return;
    }
    let cancelled = false;
    void fetchChannel(channelSlug)
      .then((result) => {
        if (!cancelled) {
          setChannel(result.data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [channelSlug]);

  useEffect(() => {
    if (!artistUsername) {
      return;
    }
    let cancelled = false;
    void fetchProfile(artistUsername)
      .then((result) => {
        if (!cancelled) {
          setProfile(result.data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [artistUsername]);

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

  const playable = detail
    ? playableFromDetail(id, detail)
    : (fastPath ??
      (processing
        ? processingPlayable(
            processing,
            user?.displayName || user?.username || '',
          )
        : null));
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
    if (!FORCE_MOCK) {
      return detail.gate === null;
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
    deletingCommentId,
    setDeletingCommentId,
    loading,
    loadError,
    retryLoad,
    processing: processing !== null,
    playlistOpen,
    setPlaylistOpen,
    downloadBusy,
    setDownloadBusy,
    downloadGates,
    setDownloadGates,
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
    reloadDetail: retryLoad,
    play,
    setStatus,
    seekTo,
    currentId,
    status,
    currentTime,
    duration,
    playable,
    rgb,
    tracklist,
    purchaseEntitled,
  };
}

export type TrackDetailState = ReturnType<typeof useTrackDetail>;
