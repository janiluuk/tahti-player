import { Link } from '@tanstack/react-router';
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

import { Badge, Button, Tooltip } from '@tahti-player/ui';

import { ChannelVisualizer } from '../../components/ChannelVisualizer';
import { WaveformSeekbar } from '../../components/tahti/WaveformSeekbar';
import { TimelineReactionBar } from '../../components/TimelineReactionBar';
import { resolveArtworkVisualizerPreset } from '../../lib/artworkVisualizer';
import { EMBED_PROVIDER_HEIGHT } from '../../lib/embedSrc';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import { type TrackPage } from './buildTrackPage';
import {
  formatReleasedOn,
  PLAYED_WAVE_COLOR,
  UNPLAYED_WAVE_COLOR,
  WAVEFORM_BARS,
} from './helpers';

export function TrackHero({ page }: { page: TrackPage }) {
  const {
    id,
    shareKey,
    router,
    user,
    detail,
    channel,
    comments,
    commentsEnabled,
    commentBody,
    setCommentBody,
    commentBusy,
    commentError,
    commentComposerOpen,
    setCommentComposerOpen,
    setPlaylistOpen,
    downloadBusy,
    buyBusy,
    setPwywOpen,
    setPwywAmt,
    setEditOpen,
    toggleFavoriteTrack,
    playable,
    isPlaying,
    totalDuration,
    progress,
    favorited,
    canPlay,
    embedProvider,
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
    canEdit,
    artistLive,
    togglePlayback,
    seekFraction,
    submitComment,
    shareTrack,
    downloadTrack,
    showBuyTrack,
    buyTrack,
  } = page;

  return (
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
          <Badge
            variant="pill"
            color="secondary"
            role="status"
            className="w-fit bg-white/15 px-2.5 py-1 tracking-wide text-white/80"
          >
            Private — viewing via share link
          </Badge>
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
                      embedProvider ? EMBED_PROVIDER_HEIGHT[embedProvider] : 152
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
                    embedSrc ? 'Write a comment' : `Write a comment at ${clock}`
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
  );
}
