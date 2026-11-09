import { Link, useCanGoBack } from '@tanstack/react-router';
import {
  ActivityIcon,
  CirclePlayIcon,
  DownloadIcon,
  HeartIcon,
  MessageCircleIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  Repeat2Icon,
  Share2Icon,
  ShoppingBagIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  BackButton,
  backButtonCornerClassName,
  BackButtonLink,
  Badge,
  Button,
  EditIconButton,
  InlineError,
  Input,
  MediaArtwork,
  Tooltip,
} from '@tahti-player/ui';

import { ChannelVisualizer } from '../../components/ChannelVisualizer';
import { ListingDate } from '../../components/ListingDate';
import { PlayerWaveform } from '../../components/PlayerWaveform';
import { ReportButton } from '../../components/ReportButton';
import { TimelineReactionBar } from '../../components/TimelineReactionBar';
import { useSoundEngagement } from '../../hooks/useSoundEngagement';
import { resolveArtworkVisualizerPreset } from '../../lib/artworkVisualizer';
import { EMBED_PROVIDER_HEIGHT } from '../../lib/embedSrc';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import { useAuthModalStore } from '../../stores/authModalStore';
import { AiGeneratedBadge } from './AiGeneratedBadge';
import { type TrackPage } from './buildTrackPage';
import { TrackAccessGate } from './TrackAccessGate';
import { mixVersionLabel } from './trackDetails';

export function TrackHero({ page }: { page: TrackPage }) {
  const { t } = useTranslation('web');
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
    setEditOpen,
    toggleFavoriteTrack,
    playable,
    isPlaying,
    totalDuration,
    favorited,
    canPlay,
    embedProvider,
    embedSrc,
    embedLabel,
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
    showDownload,
    showBuyTrack,
    startBuy,
    accessGate,
  } = page;
  const mixVersion = mixVersionLabel(playable.title, detail?.mixVersion);
  const canGoBack = useCanGoBack();
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

      <Tooltip
        content={t('actions.back')}
        side="right"
        wrapperClassName={backButtonCornerClassName}
      >
        {detail?.channel.username ? (
          <BackButtonLink
            to="/u/$username"
            params={{ username: detail.channel.username }}
            aria-label={t('actions.backTo', {
              name: detail.channel.displayName,
            })}
          />
        ) : (
          <BackButton
            onClick={() =>
              canGoBack
                ? router.history.back()
                : void router.navigate({ to: '/' })
            }
            aria-label={t('actions.back')}
          />
        )}
      </Tooltip>

      <div className="relative z-10 flex flex-col gap-5 text-white">
        {shareKey ? (
          <Badge
            variant="pill"
            color="secondary"
            role="status"
            className="w-fit bg-white/15 px-2.5 py-1 tracking-wide text-white/80"
          >
            {t('trackHero.privateViewingViaShareLink')}
          </Badge>
        ) : null}
        <div className="flex items-start gap-6 pl-14">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              {accessGate ? null : embedSrc ? (
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
                  aria-label={
                    isPlaying
                      ? t('actions.pauseItem', { title: playable.title })
                      : t('actions.playItem', { title: playable.title })
                  }
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
              ) : canPlay ? (
                <span className="shrink-0 text-xs tracking-wide text-white/55">
                  lossless
                </span>
              ) : null}
              <AiGeneratedBadge show={detail?.isAiGenerated} />
            </div>

            <div className="mt-6">
              {accessGate && detail ? (
                <TrackAccessGate
                  gate={accessGate}
                  artist={detail.channel}
                  signedIn={Boolean(user)}
                  priceCents={detail.purchaseTierPriceCents}
                  priceOptional={detail.purchaseTierPriceOptional}
                  buyBusy={buyBusy}
                  onBuy={startBuy}
                  onSignIn={() => useAuthModalStore.getState().open('login')}
                />
              ) : embedSrc ? (
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
              ) : canPlay ? (
                <>
                  <div className="mb-1 flex justify-end text-xs text-white/70 tabular-nums">
                    {clock} / {formatDuration(totalDuration) || '0:00'}
                  </div>
                  <PlayerWaveform
                    trackId={playable.id}
                    label={playable.title}
                    peaks={detail?.peaks}
                    durationSec={totalDuration}
                    markers={commentMarkers}
                    height={112}
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
                    onSignIn={() => useAuthModalStore.getState().open('login')}
                  />
                </>
              ) : null}
            </div>
          </div>

          <div className="relative hidden aspect-square w-40 shrink-0 overflow-hidden rounded-md shadow-2xl sm:block lg:w-48">
            <MediaArtwork src={cover} alt="" />
          </div>
        </div>

        {commentComposerOpen ? (
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
                      embedSrc
                        ? 'Write a comment'
                        : `Write a comment at ${clock}`
                    }
                    maxLength={2000}
                    disabled={commentBusy}
                    aria-label={
                      embedSrc ? 'Write a comment' : 'Write a timed comment'
                    }
                    className="h-auto min-w-0 rounded-none border-0 bg-transparent px-0 text-sm text-white outline-none placeholder:text-white/45 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                ) : commentsEnabled ? (
                  <Link
                    to="/login"
                    className="min-w-0 flex-1 text-sm text-white/55"
                  >
                    {embedSrc
                      ? 'Log in to write a comment'
                      : `Log in to write a comment at ${clock}`}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 text-sm text-white/55">
                    {t('trackHero.commentsAreOffForThis')}
                  </span>
                )}
              </form>
            ) : null}
          </div>
        ) : null}
        {commentError ? (
          <InlineError textSize="xs">{commentError}</InlineError>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="order-last flex items-center gap-3 text-xs text-white/70 sm:order-none"
            data-testid="track-hero-stats"
          >
            {detail?.releasedAt ? (
              <ListingDate value={detail.releasedAt} />
            ) : null}
            {detail?.playCount != null ? (
              <span className="inline-flex items-center gap-1">
                <CirclePlayIcon size={13} aria-hidden />
                <span aria-hidden>{detail.playCount.toLocaleString()}</span>
                <span className="sr-only">{`${detail.playCount} plays`}</span>
              </span>
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
              {like.state?.count ?? detail?.likeCount ?? (favorited ? 1 : 0)}
            </span>
            <ActivityIcon size={13} aria-hidden className="opacity-70" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {canEdit ? (
              <EditIconButton
                className="size-9"
                variant="default"
                label={t('actions.editItem', { title: playable.title })}
                onClick={() => setEditOpen(true)}
              />
            ) : null}
            <Tooltip
              content={
                favorited
                  ? t('actions.removeFromFavoritesItem', {
                      title: playable.title,
                    })
                  : t('actions.favoriteItem', { title: playable.title })
              }
              side="top"
            >
              <Button
                size="icon-sm"
                className="size-9"
                variant="secondary"
                aria-label={
                  favorited
                    ? t('actions.removeFromFavoritesItem', {
                        title: playable.title,
                      })
                    : t('actions.favoriteItem', { title: playable.title })
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
            <Tooltip content={t('actions.share')} side="top">
              <Button
                size="icon-sm"
                className="size-9"
                variant="secondary"
                aria-label={t('actions.shareItem', { title: playable.title })}
                onClick={() => void shareTrack()}
              >
                <Share2Icon size={15} aria-hidden />
              </Button>
            </Tooltip>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                user
                  ? setPlaylistOpen(true)
                  : useAuthModalStore.getState().open('login')
              }
            >
              <PlusIcon size={14} aria-hidden className="mr-1.5" />
              {t('actions.add')}
            </Button>
            {user && !isOwner && repost.state ? (
              <Tooltip
                content={
                  repost.state.active
                    ? t('actions.reposted')
                    : t('actions.repost')
                }
                side="top"
              >
                <Button
                  size="icon-sm"
                  className="size-9"
                  variant={repost.state.active ? 'default' : 'secondary'}
                  aria-label={
                    repost.state.active
                      ? t('actions.undoRepostItem', { title: playable.title })
                      : t('actions.repostItem', { title: playable.title })
                  }
                  aria-pressed={repost.state.active}
                  onClick={() => {
                    void repost.set(!repost.state?.active).then((result) => {
                      if (!result.ok) {
                        toast.error(result.error);
                      } else if (result.data.active) {
                        toast.success(t('toasts.reposted'));
                      }
                    });
                  }}
                >
                  <Repeat2Icon size={15} aria-hidden />
                </Button>
              </Tooltip>
            ) : null}
            {!isOwner ? (
              <ReportButton
                targetType="SOUND_ITEM"
                targetId={id}
                label={playable.title}
              />
            ) : null}
            {accessGate ? null : showBuyTrack ? (
              <Button
                size="sm"
                variant="default"
                disabled={buyBusy || !detail}
                onClick={startBuy}
              >
                <ShoppingBagIcon size={14} aria-hidden className="mr-1.5" />
                {buyBusy ? 'Buying…' : 'Buy this track'}
              </Button>
            ) : showDownload ? (
              <Tooltip
                content={
                  downloadBusy
                    ? t('actions.preparingDownload')
                    : t('actions.download')
                }
                side="top"
              >
                <Button
                  size="icon-sm"
                  className="size-9"
                  variant="secondary"
                  aria-label={
                    downloadBusy
                      ? t('actions.preparingDownloadOf', {
                          title: playable.title,
                        })
                      : t('actions.downloadItem', { title: playable.title })
                  }
                  disabled={downloadBusy || !detail || Boolean(embedSrc)}
                  onClick={() => void downloadTrack()}
                >
                  <DownloadIcon size={15} aria-hidden />
                </Button>
              </Tooltip>
            ) : null}
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
