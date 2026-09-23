import { toast } from 'sonner';

import { isHeaderImageUrl } from '../../api/channel-design';
import { fetchPublicSoundDownload, postTrackComment } from '../../api/client';
import { checkoutPurchaseTier } from '../../api/purchase-tiers';
import { type TahtiPlayable } from '../../api/types';
import { hasAccountRole } from '../../lib/accountRoles';
import { normalizeColorScheme } from '../../lib/colorScheme';
import { EMBED_PROVIDER_LABEL, embedSrcFor } from '../../lib/embedSrc';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import {
  formatTimedCommentBody,
  parseTimedComment,
} from '../../lib/timedComment';
import { type TrackDetailState } from './useTrackDetail';

export function buildTrackPage(t: TrackDetailState, playable: TahtiPlayable) {
  const {
    id,
    shareKey,
    user,
    playableId,
    detail,
    channel,
    profile,
    comments,
    setComments,
    commentsEnabled,
    commentBody,
    setCommentBody,
    setCommentBusy,
    setCommentError,
    setDownloadBusy,
    setBuyBusy,
    setPurchaseBump,
    play,
    setStatus,
    seekTo,
    currentId,
    status,
    currentTime,
    duration,
    favoriteTracks,
    rgb,
    tracklist,
    purchaseEntitled,
  } = t;

  const isCurrent = currentId === playableId;
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');
  const totalDuration = duration || playable.durationSec || 0;
  const elapsed = isCurrent ? currentTime : 0;
  const progress = isCurrent && totalDuration > 0 ? elapsed / totalDuration : 0;
  const favorited = favoriteTracks.some((t) => t.id === playable.id);
  const canPlay = Boolean(playable.streamUrl);
  // EMBED_ONLY tracks (hearthis.at, Mixcloud, Spotify, Bandcamp) have no
  // Tahti-hosted audio — the provider's own widget is the only way to
  // play them, so the transport/waveform controls above are replaced by
  // that widget instead of staying disabled.
  const embedProvider = detail?.embedProvider ?? null;
  const embedUri = detail?.embedUri ?? null;
  const embedSrc =
    embedProvider && embedUri ? embedSrcFor(embedProvider, embedUri) : null;
  const embedLabel = embedProvider ? EMBED_PROVIDER_LABEL[embedProvider] : null;
  // Only hearthis.at tracks stay playable once favorited (see
  // `playableFromDetail`'s `embed` field) — Mixcloud/Spotify/Bandcamp have
  // no shared-player-wide widget, so favoriting one would save a dead
  // entry that silently does nothing from Favorites/History.
  const favoritingUnsupported =
    Boolean(embedSrc) && embedProvider !== 'HEARTHIS';
  const clock = formatDuration(elapsed) || '0:00';
  const cover = playable.coverUrl ?? placeholderArtworkUrl(playable.id);
  const visualScheme = channel?.colorScheme
    ? normalizeColorScheme(channel.colorScheme)
    : undefined;
  // Per-track backdrop, set in Studio's track editor: a single image, a
  // gallery slideshow (same STATIC_SLIDESHOW mode + first-frame fidelity
  // as the public channel page — see ChannelView.tsx), or, when neither is
  // set, the animated visualizer over a gradient built from the track's
  // own cover art (blurred cover + a radial gradient tinted by its
  // dominant color).
  const showBackdropImage = isHeaderImageUrl(detail?.backgroundUrl);
  const showBackdropSlideshow =
    !showBackdropImage &&
    detail?.galleryMode === 'STATIC_SLIDESHOW' &&
    Boolean(detail?.slideshowUrls?.[0]);
  const ambient = rgb
    ? `radial-gradient(circle at 20% 10%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.55), transparent 55%), radial-gradient(circle at 80% 0%, rgba(${rgb[2]}, ${rgb[0]}, ${rgb[1]}, 0.35), transparent 50%)`
    : undefined;
  const commentMarkers = comments.flatMap((comment) => {
    const parsed = parseTimedComment(comment.body);
    if (parsed.seconds == null || totalDuration <= 0) {
      return [];
    }
    return [{ fraction: parsed.seconds / totalDuration }];
  });
  const activeCueId = tracklist.reduce<string | null>((current, cue) => {
    if (cue.startSec == null || cue.startSec > elapsed) {
      return current;
    }
    return cue.id;
  }, null);
  const isOwner = Boolean(user && detail?.channel.username === user.username);
  const canEdit = isOwner || hasAccountRole(user, 'BOARD');
  const artistLive = channel?.state === 'LIVE';
  const relatedTracks = (profile?.tracks ?? [])
    .filter((track) => track.id !== id)
    .slice(0, 6);
  const relatedCollections = (profile?.collections ?? []).slice(0, 4);

  const togglePlayback = () => {
    if (!canPlay) {
      return;
    }
    if (isCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    play(playable);
  };

  const seekFraction = (fraction: number) => {
    if (!canPlay) {
      return;
    }
    if (!isCurrent) {
      play(playable);
    }
    if (totalDuration > 0) {
      seekTo(fraction * totalDuration);
    }
  };

  const jumpTo = (seconds: number) => {
    if (!canPlay) {
      return;
    }
    if (!isCurrent) {
      play(playable);
    }
    seekTo(seconds);
  };

  const submitComment = async (bodyOverride?: string) => {
    const body = (bodyOverride ?? commentBody).trim();
    if (!body || !commentsEnabled || !user) {
      return;
    }
    setCommentBusy(true);
    setCommentError(null);
    // Embed-only tracks play in the provider's own widget, so Tahti never
    // observes a real playback position for them — stamping "[0:00]" on
    // every comment would be misleading, so those go in untimed.
    const stamped = embedSrc ? body : formatTimedCommentBody(clock, body);
    const result = await postTrackComment(id, stamped, shareKey);
    setCommentBusy(false);
    if (!result.ok) {
      setCommentError(result.error);
      return;
    }
    setComments((current) => [...current, result.data]);
    setCommentBody('');
  };

  const shareTrack = async () => {
    const url = `${window.location.origin}/t/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Track link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const downloadTrack = async () => {
    if (!detail) {
      return;
    }
    setDownloadBusy(true);
    const result = await fetchPublicSoundDownload(detail.channelSlug, id);
    setDownloadBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const filename =
      result.filename ??
      `${detail.title.replace(/[^\w.\- ]+/g, '').trim() || 'track'}.wav`;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = filename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const showBuyTrack =
    Boolean(detail?.accessMode === 'PURCHASE' && detail.purchaseTierId) &&
    !purchaseEntitled;

  const buyTrack = async (amountCentsOverride?: number) => {
    if (!detail?.purchaseTierId) {
      return;
    }
    if (!user) {
      toast.error('Sign in to buy this track');
      return;
    }
    setBuyBusy(true);
    const result = await checkoutPurchaseTier(
      detail.channel.username,
      detail.purchaseTierId,
      {
        trackTitle: detail.title,
        trackId: id,
        amountCents:
          amountCentsOverride ?? detail.purchaseTierPriceCents ?? undefined,
      },
    );
    setBuyBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if ('checkoutUrl' in result) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    setPurchaseBump((value) => value + 1);
    toast.success('Purchase complete');
    await downloadTrack();
  };

  return {
    ...t,
    playable,
    isCurrent,
    isPlaying,
    totalDuration,
    elapsed,
    progress,
    favorited,
    canPlay,
    embedProvider,
    embedUri,
    embedSrc,
    embedLabel,
    favoritingUnsupported,
    clock,
    cover,
    visualScheme,
    showBackdropImage,
    showBackdropSlideshow,
    ambient,
    commentMarkers,
    activeCueId,
    isOwner,
    canEdit,
    artistLive,
    relatedTracks,
    relatedCollections,
    togglePlayback,
    seekFraction,
    jumpTo,
    submitComment,
    shareTrack,
    downloadTrack,
    showBuyTrack,
    buyTrack,
  };
}

export type TrackPage = ReturnType<typeof buildTrackPage>;
