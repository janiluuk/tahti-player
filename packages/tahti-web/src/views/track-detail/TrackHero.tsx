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
import { toast } from 'sonner';

import { Badge, Button, Input, MediaArtwork, Tooltip } from '@tahti-player/ui';

import { ChannelVisualizer } from '../../components/ChannelVisualizer';
import { ReportButton } from '../../components/ReportButton';
import { WaveformSeekbar } from '../../components/tahti/WaveformSeekbar';
import { TimelineReactionBar } from '../../components/TimelineReactionBar';
import { useSoundEngagement } from '../../hooks/useSoundEngagement';
import { resolveArtworkVisualizerPreset } from '../../lib/artworkVisualizer';
import { EMBED_PROVIDER_HEIGHT } from '../../lib/embedSrc';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import { AiGeneratedBadge } from './AiGeneratedBadge';
import { type TrackPage } from './buildTrackPage';
import {
  formatReleasedOn,
  PLAYED_WAVE_COLOR,
  UNPLAYED_WAVE_COLOR,
  WAVEFORM_BARS,
} from './helpers';
import { mixVersionLabel } from './trackDetails';

export function TrackHero({ page }: { page: TrackPage }) {
  const {
    id,
    isOwner,
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
  const mixVersion = mixVersionLabel(playable.title, detail?.mixVersion);
  const like = useSoundEngagement('like', detail?.channelSlug, id);
  const repost = useSoundEngagement('repost', detail?.channelSlug, id);

  return (
    <section className="relative overflow-hidden px-6 pt-8 pb-6 md:px-10">
      {showBackdropImage ? (
        <MediaArtwork
          src={detail?.backgroundUrl}
          alt=""
          className="pointer-events-none"
        />
      ) : showBackdropSlideshow ? (
        <MediaArtwork
          src={detail?.slideshowUrls?.[0]}
          alt=""
          className="pointer-events-none"
        />
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={ambient ? { backgroundImage: ambient } : undefined}
            aria-hidden
          />
          <MediaArtwork
            src={cover}
            alt=""
            className="pointer-events-none opacity-40 blur-3xl saturate-150"
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
          <Button
            variant="text"
            size="icon-sm"
            onClick={() => router.history.back()}
            aria-label="Back"
            className="w-fit rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 active:bg-white/20"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Button>
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
                <Button
                  variant="text"
                  disabled={!canPlay}
                  onClick={togglePlayback}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="size-14 shrink-0 justify-center rounded-full bg-white p-0 text-black shadow-xl hover:bg-white active:bg-white disabled:opacity-40"
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
                </Button>
              )}
              <h1 className="font-display min-w-0 text-2xl font-semibold tracking-tight sm:text-3xl">
                {playable.title}
                {mixVersion ? (
                  <span className="font-normal text-white/60">
                    {' '}
                    ({mixVersion})
                  </span>
                ) : null}
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
              <AiGeneratedBadge show={detail?.isAiGenerated} />
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

          <div className="relative hidden aspect-video w-56 shrink-0 overflow-hidden rounded-md shadow-2xl sm:block lg:w-72">
            <MediaArtwork src={cover} alt="" />
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
              <MediaArtwork
                src={
                  user?.avatarUrl ??
                  placeholderArtworkUrl(user?.id ?? 'listener')
                }
                alt=""
                size="sm"
                className="size-7 min-w-7 shrink-0 rounded-full"
              />
              {commentsEnabled && user ? (
                <Input
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
                  className="h-auto min-w-0 rounded-none border-0 bg-transparent px-0 text-sm text-white outline-none placeholder:text-white/45 focus-visible:ring-0 focus-visible:ring-offset-0"
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
              {repost.state?.count ?? 0}
            </span>
            {detail?.downloadCount ? (
              <span className="inline-flex items-center gap-1">
                <DownloadIcon size={13} aria-hidden />
                {detail.downloadCount}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <HeartIcon size={13} aria-hidden />
              {like.state?.count ?? (favorited ? 1 : 0)}
            </span>
            <ActivityIcon size={13} aria-hidden className="opacity-70" />
          </div>
        </div>
        {commentError ? (
          <p className="text-accent-red-strong text-xs">{commentError}</p>
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
            {user && !isOwner && repost.state ? (
              <Button
                size="sm"
                variant="secondary"
                aria-pressed={repost.state.active}
                onClick={() => {
                  void repost.set(!repost.state?.active).then((result) => {
                    if (!result.ok) {
                      toast.error(result.error);
                    } else if (result.data.active) {
                      toast.success('Reposted.');
                    }
                  });
                }}
              >
                <Repeat2Icon size={14} aria-hidden className="mr-1.5" />
                {repost.state.active ? 'Reposted' : 'Repost'}
              </Button>
            ) : null}
            {!isOwner ? (
              <ReportButton
                targetType="SOUND_ITEM"
                targetId={id}
                label={playable.title}
              />
            ) : null}
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
                onClick={() => {
                  toggleFavoriteTrack(playable);
                  if (user) {
                    void like.set(!favorited);
                  }
                }}
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
              <div className="relative">
                <MediaArtwork
                  src={
                    detail.channel.avatarUrl ??
                    placeholderArtworkUrl(detail.channel.username)
                  }
                  alt=""
                  size="sm"
                  className="size-8 min-w-8 rounded-full"
                />
                {artistLive ? (
                  <span className="bg-accent-red absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-black" />
                ) : null}
              </div>
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
