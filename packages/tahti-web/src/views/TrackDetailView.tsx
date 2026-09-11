import { Link, useRouter } from '@tanstack/react-router';
import {
  ActivityIcon,
  ArrowLeftIcon,
  DownloadIcon,
  HeartIcon,
  MessageCircleIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  Repeat2Icon,
  Share2Icon,
  ShoppingBagIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input, Tooltip } from '@tahti-player/ui';

import { isHeaderImageUrl } from '../api/channel-design';
import {
  fetchChannel,
  fetchProfile,
  fetchPublicSoundDownload,
  fetchTrackComments,
  fetchTrackDetail,
  postTrackComment,
} from '../api/client';
import { listMockCommerceFanSubs } from '../api/mock-commerce-ledger';
import { listMockSubscriptions } from '../api/mock-session';
import { isForceMock } from '../api/mode';
import {
  checkoutPurchaseTier,
  mockOwnsPurchaseTier,
} from '../api/purchase-tiers';
import type {
  PublicChannel,
  PublicProfile,
  PublicTrackDetail,
  TahtiPlayable,
  TrackComment,
} from '../api/types';
import { AddToPlaylistPanel } from '../components/AddToPlaylistPanel';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { WaveformSeekbar } from '../components/tahti/WaveformSeekbar';
import { TimelineReactionBar } from '../components/TimelineReactionBar';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { hasAccountRole } from '../lib/accountRoles';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { cn } from '../lib/cn';
import { normalizeColorScheme } from '../lib/colorScheme';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
} from '../lib/embedSrc';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { formatDuration } from '../lib/playableToTrack';
import { parsePublicTracklist } from '../lib/publicTracklist';
import { formatTimedCommentBody, parseTimedComment } from '../lib/timedComment';
import { useDominantColor } from '../lib/useDominantColor';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { useTrackDetailStore } from '../stores/trackDetailStore';

/** Fallback bar count for the synthetic (no-peaks) waveform only. Real peaks
 * render at their native resolution instead of being downsampled to this. */
const WAVEFORM_BARS = 180;
const PLAYED_WAVE_COLOR = '#6CFF6B';
const UNPLAYED_WAVE_COLOR = 'rgba(255,255,255,0.78)';

function playableFromDetail(
  id: string,
  detail: PublicTrackDetail,
): TahtiPlayable {
  return {
    id: `sound:${id}`,
    kind: 'sound',
    title: detail.title,
    artist: detail.artistName,
    coverUrl: detail.bannerUrl ?? undefined,
    streamUrl: detail.audioUrl ?? '',
    protocol: detail.audioUrl?.includes('.m3u8') ? 'hls' : 'https',
    // Only hearthis.at has a shared-player-wide embed widget (the bottom
    // bar and fullscreen player special-case `embed.provider: 'hearthis'`);
    // Mixcloud/Spotify/Bandcamp only ever play through this page's own
    // inline widget below, same as everywhere else those three appear.
    embed:
      detail.embedProvider === 'HEARTHIS' && detail.embedUri
        ? { provider: 'hearthis', embedUri: detail.embedUri }
        : undefined,
    sourceProvider:
      detail.embedProvider === 'HEARTHIS' ? 'hearthis' : undefined,
    channelSlug: detail.channelSlug,
    durationSec: detail.durationSec ?? undefined,
    peaks: detail.peaks,
  };
}

function formatReleasedOn(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `on ${day}.${month}.${date.getFullYear()}`;
}

function cueLabel(artist: string | null, title: string): string {
  return artist ? `${artist} - ${title}` : title;
}

export function TrackDetailView({
  id,
  shareKey,
}: {
  id: string;
  /** Present when this page was opened via a PRIVATE/STASH sound's share
   * link (`/t/$id?key=...`, see SoundShareLinksSection). Passed through to
   * every fetch/comment call so the backend can serve the otherwise-private
   * sound and log the visit/interaction to the audit log instead of
   * treating it as public activity. */
  shareKey?: string;
}) {
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

  if (!playable) {
    if (loading) {
      return (
        <div className="flex min-h-full items-center justify-center">
          <PageLoading label="Loading track…" />
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-lg flex-col py-10">
        <PageEmpty
          title="Track unavailable"
          description="This track doesn't exist, isn't public, or was removed."
          action={
            <Link to="/">
              <Button size="sm" variant="secondary">
                Back to Listen
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

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

  return (
    <div
      className="-mx-6 -mt-6 min-h-full md:-mx-8 md:-mt-8"
      data-testid="track-listen-page"
    >
      <section className="relative overflow-hidden px-6 pt-8 pb-6 md:px-10">
        {showBackdropImage ? (
          <img
            src={detail?.backgroundUrl ?? undefined}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        ) : showBackdropSlideshow ? (
          <img
            src={detail?.slideshowUrls?.[0]}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <div
              className="pointer-events-none absolute inset-0"
              style={ambient ? { backgroundImage: ambient } : undefined}
              aria-hidden
            />
            <img
              src={cover}
              alt=""
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-40 blur-3xl saturate-150"
            />
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <ChannelVisualizer
                preset={resolveArtworkVisualizerPreset(id)}
                colorScheme={visualScheme}
                colorSchemeJson={channel?.colorSchemeJson}
                artworkUrl={cover}
                className="size-full"
              />
            </div>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/45" />

        <div className="relative z-10 flex flex-col gap-5 text-white">
          <Tooltip content="Back" side="right">
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Back"
              className="flex size-8 w-fit items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              <ArrowLeftIcon size={16} aria-hidden />
            </button>
          </Tooltip>
          {shareKey ? (
            <span
              role="status"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold tracking-wide text-white/80 uppercase"
            >
              Private — viewing via share link
            </span>
          ) : null}
          <div className="flex items-start gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                {embedSrc ? (
                  <span className="border-border/40 flex size-14 shrink-0 items-center justify-center rounded-full border bg-white/10">
                    <PlayIcon
                      size={22}
                      fill="currentColor"
                      className="ml-0.5 text-white/70"
                      aria-hidden
                    />
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!canPlay}
                    onClick={togglePlayback}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-xl disabled:opacity-40"
                  >
                    {isPlaying ? (
                      <PauseIcon size={22} fill="currentColor" aria-hidden />
                    ) : (
                      <PlayIcon
                        size={22}
                        fill="currentColor"
                        className="ml-0.5"
                        aria-hidden
                      />
                    )}
                  </button>
                )}
                <h1 className="font-display min-w-0 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {playable.title}
                </h1>
                {embedSrc ? (
                  <span className="shrink-0 text-xs tracking-wide text-white/55">
                    via {embedLabel}
                  </span>
                ) : playable.streamUrl ? (
                  <span className="shrink-0 text-xs tracking-wide text-white/55">
                    lossless
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                {embedSrc ? (
                  <div className="overflow-hidden rounded-lg">
                    <iframe
                      title={`${playable.title} — ${embedLabel} player`}
                      src={embedSrc}
                      width="100%"
                      height={
                        embedProvider
                          ? EMBED_PROVIDER_HEIGHT[embedProvider]
                          : 152
                      }
                      style={{ border: 0, display: 'block' }}
                      allow="autoplay; encrypted-media"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <>
                    <div className="mb-1 flex justify-end text-xs text-white/70 tabular-nums">
                      {clock} / {formatDuration(totalDuration) || '0:00'}
                    </div>
                    <WaveformSeekbar
                      trackId={playable.id}
                      progress={progress}
                      peaks={detail?.peaks}
                      bars={detail?.peaks?.length || WAVEFORM_BARS}
                      markers={commentMarkers}
                      className="h-28"
                      playedColor={PLAYED_WAVE_COLOR}
                      unplayedColor={UNPLAYED_WAVE_COLOR}
                      onSeek={seekFraction}
                    />
                    <TimelineReactionBar
                      clock={clock}
                      commentsEnabled={commentsEnabled}
                      signedIn={Boolean(user)}
                      busy={commentBusy}
                      commentOpen={commentComposerOpen}
                      onReact={(emoticon) => void submitComment(emoticon)}
                      onComment={() => setCommentComposerOpen((open) => !open)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="hidden w-56 shrink-0 overflow-hidden rounded-md shadow-2xl sm:block lg:w-72">
              <img
                src={cover}
                alt=""
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {commentComposerOpen ? (
              <form
                className="flex min-w-[16rem] flex-1 items-center gap-3 rounded-md bg-black/55 px-3 py-2 backdrop-blur-md"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitComment();
                }}
              >
                <img
                  src={
                    user?.avatarUrl ??
                    placeholderArtworkUrl(user?.id ?? 'listener')
                  }
                  alt=""
                  className="size-7 shrink-0 rounded-full object-cover"
                />
                {commentsEnabled && user ? (
                  <input
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder={
                      embedSrc
                        ? 'Write a comment'
                        : `Write a comment at ${clock}`
                    }
                    maxLength={2000}
                    disabled={commentBusy}
                    aria-label={
                      embedSrc ? 'Write a comment' : 'Write a timed comment'
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                  />
                ) : (
                  <Link
                    to="/login"
                    className="min-w-0 flex-1 text-sm text-white/55"
                  >
                    {!commentsEnabled
                      ? 'Comments are off for this track'
                      : embedSrc
                        ? 'Log in to write a comment'
                        : `Log in to write a comment at ${clock}`}
                  </Link>
                )}
              </form>
            ) : null}
            <div className="flex items-center gap-3 text-xs text-white/70">
              {detail?.releasedAt ? (
                <span>{formatReleasedOn(detail.releasedAt)}</span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <MessageCircleIcon size={13} aria-hidden />
                {detail?.commentCount ?? comments.length}
              </span>
              <span className="inline-flex items-center gap-1">
                <Repeat2Icon size={13} aria-hidden />
                {detail?.downloadCount ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <HeartIcon size={13} aria-hidden />
                {favorited ? 1 : 0}
              </span>
              <ActivityIcon size={13} aria-hidden className="opacity-70" />
            </div>
          </div>
          {commentError ? (
            <p className="text-accent-red text-xs">{commentError}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {canEdit ? (
                <Tooltip content="Edit this sound" side="top">
                  <Button
                    size="icon-sm"
                    variant="default"
                    aria-label="Edit"
                    onClick={() => setEditOpen(true)}
                  >
                    <PencilIcon size={15} aria-hidden />
                  </Button>
                </Tooltip>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void shareTrack()}
              >
                <Share2Icon size={14} aria-hidden className="mr-1.5" />
                Share
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPlaylistOpen(true)}
                disabled={!user}
              >
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                Add
              </Button>
              {showBuyTrack ? (
                <Button
                  size="sm"
                  variant="default"
                  disabled={buyBusy || !detail}
                  onClick={() => {
                    if (detail?.purchaseTierPriceOptional) {
                      setPwywAmt(
                        ((detail.purchaseTierPriceCents ?? 0) / 100).toFixed(2),
                      );
                      setPwywOpen(true);
                      return;
                    }
                    void buyTrack();
                  }}
                >
                  <ShoppingBagIcon size={14} aria-hidden className="mr-1.5" />
                  {buyBusy ? 'Buying…' : 'Buy this track'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={downloadBusy ? 'Preparing download' : 'Download'}
                  disabled={downloadBusy || !detail || Boolean(embedSrc)}
                  onClick={() => void downloadTrack()}
                >
                  <DownloadIcon size={14} aria-hidden className="mr-1.5" />
                  Download
                </Button>
              )}
              <Tooltip
                content={
                  favorited
                    ? 'Remove from favorites'
                    : favoritingUnsupported
                      ? `Favoriting isn't supported yet for ${embedLabel} tracks`
                      : 'Favorite'
                }
                side="top"
              >
                <Button
                  size="icon-sm"
                  variant="secondary"
                  disabled={!favorited && favoritingUnsupported}
                  aria-label={
                    favorited
                      ? 'Remove from favorites'
                      : favoritingUnsupported
                        ? `Favoriting isn't supported yet for ${embedLabel} tracks`
                        : 'Favorite'
                  }
                  onClick={() => toggleFavoriteTrack(playable)}
                >
                  <HeartIcon
                    size={15}
                    aria-hidden
                    className={
                      favorited ? 'fill-accent-red text-accent-red' : undefined
                    }
                  />
                </Button>
              </Tooltip>
            </div>
            {detail ? (
              <Link
                to="/u/$username"
                params={{ username: detail.channel.username }}
                className="flex items-center gap-2 rounded-full bg-black/35 py-1 pr-3 pl-1"
              >
                <span className="relative">
                  <img
                    src={
                      detail.channel.avatarUrl ??
                      placeholderArtworkUrl(detail.channel.username)
                    }
                    alt=""
                    className="size-8 rounded-full object-cover"
                  />
                  {artistLive ? (
                    <span className="bg-accent-red absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-black" />
                  ) : null}
                </span>
                <span className="text-sm font-medium">
                  {detail.channel.displayName}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-8 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            {detail?.description ? (
              <div className="mb-6 text-sm leading-relaxed whitespace-pre-wrap">
                {detail.description}
              </div>
            ) : null}
            {tracklist.length > 0 ? (
              <ol className="flex flex-col gap-1.5 text-sm">
                {tracklist.map((cue) => (
                  <li key={cue.id} className="flex flex-wrap items-baseline">
                    <button
                      type="button"
                      onClick={() => {
                        if (cue.startSec != null) {
                          jumpTo(cue.startSec);
                        }
                      }}
                      className={cn(
                        'hover:text-primary text-left',
                        cue.id === activeCueId && 'text-primary font-medium',
                      )}
                    >
                      {cue.startSec != null ? (
                        <span className="text-foreground-secondary mr-2 tabular-nums">
                          {formatDuration(cue.startSec)}
                        </span>
                      ) : null}
                      {cue.artist && cue.artistUsername
                        ? cue.title
                        : cueLabel(cue.artist, cue.title)}
                    </button>
                    {cue.artist && cue.artistUsername ? (
                      <>
                        <span className="mx-1">–</span>
                        <Link
                          to="/u/$username"
                          params={{ username: cue.artistUsername }}
                          className="text-primary hover:underline"
                        >
                          {cue.artist}
                        </Link>
                      </>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}

            <div className="mt-10">
              <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
                Comments
              </h2>
              {comments.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No comments yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {comments.map((comment) => {
                    const parsed = parseTimedComment(comment.body);
                    const cueSeconds = parsed.seconds;
                    return (
                      <li key={comment.id} className="flex gap-3">
                        <img
                          src={
                            comment.authorAvatarUrl ??
                            placeholderArtworkUrl(comment.authorUsername)
                          }
                          alt=""
                          className="size-8 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-sm font-semibold">
                              {comment.authorDisplayName}
                            </span>
                            {parsed.timestamp && cueSeconds != null ? (
                              <button
                                type="button"
                                className="text-primary text-xs tabular-nums"
                                onClick={() => jumpTo(cueSeconds)}
                              >
                                {parsed.timestamp}
                              </button>
                            ) : null}
                            <time
                              className="text-foreground-secondary text-xs"
                              dateTime={comment.createdAt}
                            >
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                          <p className="mt-1 text-sm">{parsed.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            {relatedCollections.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                  Collections
                </h2>
                <ul className="flex flex-col gap-3">
                  {relatedCollections.map((collection) => (
                    <li key={collection.slug}>
                      <Link
                        to="/u/$username/c/$slug"
                        params={{
                          username: detail?.channel.username ?? '',
                          slug: collection.slug,
                        }}
                        className="hover:bg-background-secondary flex items-center gap-3 rounded-lg p-1"
                      >
                        <img
                          src={
                            collection.coverUrl ??
                            placeholderArtworkUrl(collection.slug)
                          }
                          alt=""
                          className="size-14 shrink-0 rounded object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {collection.name}
                          </span>
                          <span className="text-foreground-secondary block text-xs">
                            {collection.itemCount}{' '}
                            {collection.itemCount === 1 ? 'track' : 'tracks'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {relatedTracks.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                  More from {playable.artist}
                </h2>
                <ul className="flex flex-col gap-3">
                  {relatedTracks.map((track) => (
                    <li key={track.id}>
                      <Link
                        to="/t/$id"
                        params={{ id: track.id }}
                        className="hover:bg-background-secondary flex items-center gap-3 rounded-lg p-1"
                      >
                        <img
                          src={
                            track.bannerUrl ?? placeholderArtworkUrl(track.id)
                          }
                          alt=""
                          className="size-14 shrink-0 rounded object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {track.title}
                          </span>
                          {track.durationSec ? (
                            <span className="text-foreground-secondary text-xs tabular-nums">
                              {formatDuration(track.durationSec)}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <AddToPlaylistPanel
        isOpen={playlistOpen}
        soundId={id}
        trackTitle={playable.title}
        onClose={() => setPlaylistOpen(false)}
      />

      <Dialog.Root isOpen={pwywOpen} onClose={() => setPwywOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const eurosN = Number(pwywAmt.replace(',', '.'));
            if (!Number.isFinite(eurosN) || eurosN < 0) {
              toast.error('Enter an amount of €0 or more.');
              return;
            }
            setPwywOpen(false);
            void buyTrack(Math.round(eurosN * 100));
          }}
        >
          <Dialog.Title>Name your price</Dialog.Title>
          <Dialog.Description>
            The artist set €
            {((detail?.purchaseTierPriceCents ?? 0) / 100).toFixed(2)} as a
            suggestion — pay that, more, or less (down to €0).
          </Dialog.Description>
          <div className="mt-4">
            <Input
              label="Amount (€)"
              value={pwywAmt}
              onChange={(e) => setPwywAmt(e.target.value)}
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button type="submit" disabled={buyBusy}>
              {buyBusy ? 'Buying…' : 'Buy this track'}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>

      {canEdit ? (
        <TrackEditDialog
          soundId={editOpen ? id : null}
          onClose={() => setEditOpen(false)}
          onSaved={reloadDetail}
        />
      ) : null}
    </div>
  );
}
