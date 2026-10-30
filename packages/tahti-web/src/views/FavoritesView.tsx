import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

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
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

export function FavoritesView({ embedded = false }: { embedded?: boolean }) {
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
  const audioFavorites = favoriteTracks.filter(
    (track) => track.kind === 'sound' || Boolean(track.embed),
  );
  const [likedTracks, setLikedTracks] = useState<TahtiPlayable[]>([]);
  const [likesError, setLikesError] = useState<string | null>(null);
  const [likesAttempt, setLikesAttempt] = useState(0);

  useEffect(() => {
    if (!hydrated || !user) {
      setLikedTracks([]);
      setLikesError(null);
      return;
    }
    let cancelled = false;
    void fetchMyLikes().then(({ data, meta }) => {
      if (!cancelled) {
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
  }, [hydrated, likesAttempt, user]);

  const body = (
    <div className="flex flex-col gap-6">
      <SectionShell title="Channels">
        {favoriteChannels.length === 0 && radioFavorites.length === 0 ? (
          <PageEmpty
            title="No favorite channels"
            description="Heart one from Discover → Artists or a channel page."
            action={
              <ButtonLink
                className="w-fit"
                to="/discover"
                search={{ tab: 'artists' }}
                size="sm"
                variant="secondary"
              >
                Browse artists
              </ButtonLink>
            }
          />
        ) : (
          <CardGrid className="grid-cols-[repeat(auto-fill,11.5rem)]">
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
                  subtitle={ch.slug}
                  isPlaying={channelPlaying}
                  playLabel={`Play ${ch.displayName}`}
                  pauseLabel={`Pause ${ch.displayName}`}
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
                  queueLabel={`Queue ${ch.displayName}`}
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
                  playLabel={`Play ${name}`}
                  pauseLabel={`Pause ${name}`}
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
                  queueLabel={`Queue ${name}`}
                  onFavorite={() =>
                    useLibraryStore.getState().toggleFavoriteTrack(radio)
                  }
                  favorited
                />
              );
            })}
          </CardGrid>
        )}
      </SectionShell>

      <SectionShell title="Tracks">
        {audioFavorites.length === 0 ? (
          <PageEmpty
            title="No favorite tracks"
            description="Heart a track on its page or in any track list."
            action={
              <ButtonLink
                className="w-fit"
                to="/discover"
                size="sm"
                variant="secondary"
              >
                Find music
              </ButtonLink>
            }
          />
        ) : (
          <PlayableAmbientTrackList items={audioFavorites} />
        )}
        {likesError ? (
          <PageError
            title="Could not load your likes"
            description={likesError}
            onRetry={() => setLikesAttempt((n) => n + 1)}
          />
        ) : null}
      </SectionShell>

      {likedTracks.length > 0 ? (
        <SectionShell title="Liked on Tahti">
          <PlayableAmbientTrackList
            items={likedTracks}
            getTrackMeta={likedTrackMeta}
            emptyMessage="No liked tracks yet."
          />
        </SectionShell>
      ) : null}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <ViewShell title="Favorites" classes={{ root: 'px-0 pt-0' }}>
      {body}
    </ViewShell>
  );
}
