import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  Card,
  CardGrid,
  SectionShell,
  ViewShell,
} from '@tahti-player/ui';

import { fetchChannel } from '../api/client';
import {
  fetchMyLikes,
  likedTrackMeta,
  likedTrackToPlayable,
} from '../api/likes';
import type { TahtiPlayable } from '../api/types';
import { PageEmpty, PageError } from '../components/PageStates';
import { PlayableAmbientTrackList } from '../components/PlayableAmbientTrackList';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { webT } from '../lib/webT';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';

export function FavoritesView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const favoriteChannels = useLibraryStore((s) => s.favoriteChannels);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);
  const radioFavorites = favoriteTracks.filter(
    (track) => track.kind === 'radio',
  );
  const [likedTracks, setLikedTracks] = useState<TahtiPlayable[]>([]);
  const [likesError, setLikesError] = useState<string | null>(null);
  const [likesAttempt, setLikesAttempt] = useState(0);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const likesImported = useSoundLikesStore((s) => s.importedAt);

  useEffect(() => {
    if (!hydrated || !user) {
      setLikedTracks([]);
      setLikesError(null);
      setLikesLoaded(false);
      return;
    }
    let cancelled = false;
    void fetchMyLikes().then(({ data, meta }) => {
      if (!cancelled) {
        setLikesLoaded(true);
        setLikesError(meta.source === 'api' ? (meta.reason ?? null) : null);
        setLikedTracks(
          data.flatMap((track) => {
            const playable = likedTrackToPlayable(track);
            return playable ? [playable] : [];
          }),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, likesAttempt, likesImported, user]);

  const body = (
    <div className="flex flex-col gap-6">
      <SectionShell title={t('favoritesView.channels')}>
        {favoriteChannels.length === 0 && radioFavorites.length === 0 ? (
          <PageEmpty
            title={t('empties.noFavoriteChannels')}
            description={t('empties.heartOneFromDiscoverArtistsOr')}
            action={
              <ButtonLink
                className="w-fit"
                to="/discover"
                search={{ tab: 'artists' }}
                size="sm"
                variant="secondary"
              >
                {t('favoritesView.browseArtists')}
              </ButtonLink>
            }
          />
        ) : (
          <CardGrid className="grid-cols-2 sm:grid-cols-[repeat(auto-fill,11.5rem)]">
            {favoriteChannels.map((ch) => {
              const channelPlaying =
                currentId === `live:${ch.slug}` &&
                (playerStatus === 'playing' || playerStatus === 'loading');
              return (
                <Card
                  key={ch.slug}
                  surface="neutral"
                  src={ch.avatarUrl ?? placeholderArtworkUrl(ch.slug)}
                  title={
                    <Link
                      to="/channel/$slug"
                      params={{ slug: ch.slug }}
                      className="hover:underline"
                    >
                      {ch.displayName}
                    </Link>
                  }
                  subtitle={`@${ch.username ?? ch.slug}`}
                  isPlaying={channelPlaying}
                  playLabel={webT()('a11yNamed.play', { name: ch.displayName })}
                  pauseLabel={webT()('a11yNamed.pause', {
                    name: ch.displayName,
                  })}
                  onPlay={() => {
                    if (channelPlaying) {
                      setPlayerStatus('paused');
                      return;
                    }
                    if (currentId === `live:${ch.slug}`) {
                      setPlayerStatus('playing');
                      return;
                    }
                    void fetchChannel(ch.slug).then(({ playable }) => {
                      if (playable) {
                        play(playable);
                      }
                    });
                  }}
                  onQueue={() => {
                    void fetchChannel(ch.slug).then(({ playable }) => {
                      if (playable) {
                        enqueue(playable);
                      }
                    });
                  }}
                  queueLabel={webT()('a11yNamed.queue', {
                    name: ch.displayName,
                  })}
                  onFavorite={() => toggleFavoriteChannel(ch)}
                  favorited
                />
              );
            })}
            {radioFavorites.map((radio) => {
              const name = radio.artist || radio.title;
              const radioPlaying =
                radio.id === currentId &&
                (playerStatus === 'playing' || playerStatus === 'loading');
              return (
                <Card
                  key={radio.id}
                  surface="neutral"
                  src={radio.coverUrl ?? placeholderArtworkUrl(radio.id)}
                  title={
                    <Link to="/radio" className="hover:underline">
                      {name}
                    </Link>
                  }
                  isPlaying={radioPlaying}
                  playLabel={webT()('a11yNamed.play', { name: name })}
                  pauseLabel={webT()('a11yNamed.pause', { name: name })}
                  onPlay={() => {
                    if (radioPlaying) {
                      setPlayerStatus('paused');
                    } else if (radio.id === currentId) {
                      setPlayerStatus('playing');
                    } else {
                      play(radio);
                    }
                  }}
                  onQueue={() => enqueue(radio)}
                  queueLabel={webT()('a11yNamed.queue', { name: name })}
                  onFavorite={() =>
                    useLibraryStore.getState().toggleFavoriteStation(radio)
                  }
                  favorited
                />
              );
            })}
          </CardGrid>
        )}
      </SectionShell>

      <SectionShell title={t('favoritesView.likedTracks')}>
        {!hydrated ? null : !user ? (
          <PageEmpty
            title={t('empties.signInToSeeYourLikes')}
            description={t('empties.likesFollowYourAccount')}
            action={
              <ButtonLink
                className="w-fit"
                to="/login"
                size="sm"
                variant="secondary"
              >
                {t('actions.signIn')}
              </ButtonLink>
            }
          />
        ) : likesError ? (
          <PageError
            title={t('loadErrors.couldNotLoadYourLikes')}
            description={likesError}
            onRetry={() => setLikesAttempt((n) => n + 1)}
          />
        ) : likesLoaded && likedTracks.length === 0 ? (
          <PageEmpty
            title={t('empties.noLikedTracks')}
            description={t('empties.heartATrackOnItsPage')}
            action={
              <ButtonLink
                className="w-fit"
                to="/discover"
                size="sm"
                variant="secondary"
              >
                {t('favoritesView.findMusic')}
              </ButtonLink>
            }
          />
        ) : likesLoaded ? (
          <PlayableAmbientTrackList
            items={likedTracks}
            getTrackMeta={likedTrackMeta}
          />
        ) : null}
      </SectionShell>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <ViewShell
      title={t('favoritesView.favorites')}
      classes={{ root: 'px-0 pt-0' }}
    >
      {body}
    </ViewShell>
  );
}
