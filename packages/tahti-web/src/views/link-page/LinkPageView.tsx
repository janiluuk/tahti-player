import { ExternalLinkIcon, LinkIcon, Share2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonAnchor, MediaArtwork } from '@tahti-player/ui';

import type { PublicLinkPage, PublicLinkPageSound } from '../../api/link-page';
import type { PublicProfile, TahtiPlayable } from '../../api/types';
import {
  ContentReveal,
  PageEmpty,
  PageError,
  ProfileSkeleton,
} from '../../components/PageStates';
import { formatDuration } from '../../lib/playableToTrack';
import { webT } from '../../lib/webT';
import { usePlayerStore } from '../../stores/playerStore';

function shareLinkPage(url: string, title: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    void navigator.share({ title, url }).catch(() => undefined);
    return;
  }
  void navigator.clipboard.writeText(url).then(
    () => toast.success(webT()('toasts.linkCopied')),
    () => toast.error(webT()('toasts.linkCopied')),
  );
}

function soundToPlayable(
  sound: PublicLinkPageSound,
  artist: string,
): TahtiPlayable | null {
  if (!sound.playUrl) {
    return null;
  }
  const isHls = sound.playUrl.includes('.m3u8');
  return {
    id: `sound:${sound.id}`,
    kind: 'sound',
    title: sound.title,
    artist,
    coverUrl: sound.coverUrl ?? undefined,
    streamUrl: sound.playUrl,
    protocol: isHls ? 'hls' : 'https',
    durationSec: sound.durationSec ?? undefined,
  };
}

function LinkPageSoundRow({
  sound,
  playMode,
  siteUrl,
  isPlaying,
  onPlay,
}: {
  sound: PublicLinkPageSound;
  playMode: PublicLinkPage['playMode'];
  siteUrl: string;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const { t } = useTranslation('web');
  const openExternal = () => {
    window.open(`${siteUrl}`, '_blank', 'noopener,noreferrer');
  };
  return (
    <button
      type="button"
      data-testid="link-page-sound"
      className="border-border bg-background-secondary hover:border-foreground/30 flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors"
      onClick={() => {
        if (playMode === 'open') {
          openExternal();
          return;
        }
        onPlay();
      }}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
        <MediaArtwork
          src={sound.coverUrl ?? undefined}
          seed={sound.id}
          alt={sound.title}
          size="fill"
          isPlaying={isPlaying}
          onPlay={playMode === 'inline' ? onPlay : openExternal}
          playLabel={webT()('a11yNamed.play', { name: sound.title })}
          pauseLabel={webT()('a11yNamed.pause', { name: sound.title })}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate font-semibold">
          {sound.title}
        </div>
        <div className="text-foreground-secondary mt-0.5 flex flex-wrap items-center gap-2 text-xs">
          {sound.badge === 'live' ? (
            <span className="text-accent-red-strong font-semibold uppercase">
              {t('listen.liveBadge')}
            </span>
          ) : null}
          {sound.durationSec != null ? (
            <span className="tabular-nums">
              {formatDuration(sound.durationSec)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function LinkPageView({
  profile,
  loading,
  error,
  onRetry,
}: {
  profile: PublicProfile | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation('web');
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);

  const linkPage = profile?.linkPage;
  const artist = profile?.artist;
  const sounds = useMemo(() => linkPage?.sounds ?? [], [linkPage?.sounds]);

  if (loading && !profile) {
    return (
      <div role="status" aria-label={t('loading.loadingArtist')}>
        <ProfileSkeleton />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadThisArtist')}
        description={error}
        onRetry={onRetry}
      />
    );
  }

  if (!profile || !artist || !linkPage) {
    return (
      <PageEmpty
        headingLevel={1}
        title={t('empties.artistNotFound')}
        description={t('empties.thisArtistProfileMayHaveBeen')}
      />
    );
  }

  const location =
    artist.defaultLocation?.trim() ||
    (artist.countryCode ? artist.countryCode : null);

  return (
    <ContentReveal
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8"
      data-testid="link-page"
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <div
          data-testid="link-page-avatar"
          className="relative size-28 shrink-0 overflow-hidden rounded-full"
        >
          <MediaArtwork
            src={artist.avatarUrl ?? undefined}
            seed={artist.username}
            alt={artist.displayName}
            size="fill"
            imageReveal={Boolean(artist.avatarUrl)}
          />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {artist.displayName}
          </h1>
          {location ? (
            <p className="text-foreground-secondary mt-1 text-sm">{location}</p>
          ) : null}
        </div>
        {artist.bio ? (
          <p className="text-foreground-secondary text-sm whitespace-pre-wrap">
            {artist.bio}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonAnchor href={linkPage.siteUrl}>
            {t('linkPage.openProfile')}
          </ButtonAnchor>
          <Button
            variant="secondary"
            onClick={() =>
              shareLinkPage(linkPage.linkPageUrl, artist.displayName)
            }
          >
            <Share2Icon size={16} aria-hidden />
            <span className="ml-1.5">{t('actions.share')}</span>
          </Button>
        </div>
      </header>

      {linkPage.links.length > 0 ? (
        <section
          className="flex flex-col gap-2"
          aria-label={t('linkPage.links')}
        >
          {linkPage.links.map((link) => (
            <ButtonAnchor
              key={link.key}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="h-auto w-full justify-center py-3"
              data-testid="link-page-link"
            >
              <LinkIcon size={16} aria-hidden className="mr-2 shrink-0" />
              <span className="truncate">{link.label}</span>
              <ExternalLinkIcon
                size={14}
                aria-hidden
                className="ml-2 shrink-0 opacity-60"
              />
            </ButtonAnchor>
          ))}
        </section>
      ) : null}

      {sounds.length > 0 ? (
        <section
          className="flex flex-col gap-2"
          aria-label={t('linkPage.sounds')}
        >
          <h2 className="text-foreground text-sm font-bold tracking-wide uppercase">
            {t('linkPage.sounds')}
          </h2>
          {sounds.map((sound) => {
            const playableId = `sound:${sound.id}`;
            const isPlaying =
              currentId === playableId &&
              (status === 'playing' || status === 'loading');
            return (
              <LinkPageSoundRow
                key={sound.id}
                sound={sound}
                playMode={linkPage.playMode}
                siteUrl={linkPage.siteUrl}
                isPlaying={isPlaying}
                onPlay={() => {
                  const playable = soundToPlayable(sound, artist.displayName);
                  if (playable) {
                    play(playable);
                  }
                }}
              />
            );
          })}
        </section>
      ) : null}

      {linkPage.sets.length > 0 ? (
        <section
          className="flex flex-col gap-2"
          aria-label={t('linkPage.sets')}
        >
          <h2 className="text-foreground text-sm font-bold tracking-wide uppercase">
            {t('linkPage.sets')}
          </h2>
          {linkPage.sets.map((set) => (
            <ButtonAnchor
              key={set.id}
              href={set.url}
              variant="text"
              className="border-border bg-background-secondary hover:border-foreground/30 flex h-auto w-full items-center justify-start gap-3 rounded-lg border p-2"
              data-testid="link-page-set"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-md">
                <MediaArtwork
                  src={set.coverUrl ?? undefined}
                  seed={set.slug}
                  alt={set.name}
                  size="fill"
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-foreground truncate font-semibold">
                  {set.name}
                </div>
                <div className="text-foreground-secondary text-xs">
                  {t('linkPage.setItemCount', { count: set.itemCount })}
                </div>
              </div>
            </ButtonAnchor>
          ))}
        </section>
      ) : null}
    </ContentReveal>
  );
}
