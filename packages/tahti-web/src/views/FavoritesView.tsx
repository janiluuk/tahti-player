import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  Button,
  ButtonLink,
  Card,
  CardGrid,
  SectionShell,
  ViewShell,
} from '@tahti-player/ui';

import { fetchChannel } from '../api/client';
import { fetchMyLikes, likedTrackToPlayable } from '../api/likes';
import type { TahtiPlayable } from '../api/types';
import {
  MediaIconActions,
  playQueueFavoriteActions,
} from '../components/MediaIconActions';
import { PageEmpty, PageError } from '../components/PageStates';
import { PlayableAmbientTrackList } from '../components/PlayableAmbientTrackList';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthModalStore } from '../stores/authModalStore';
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
  }, [likesAttempt]);

  if (hydrated && !user) {
    const signedOut = (
      <PageEmpty
        icon="inbox"
        title="Sign in to see favorites"
        description="Heart channels and tracks while you listen, then find them here."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              Sign in
            </Button>
            <ButtonLink to="/discover" size="sm" variant="secondary">
              Discover music
            </ButtonLink>
          </div>
        }
      />
    );
    return embedded ? (
      signedOut
    ) : (
      <ViewShell title="Favorites" classes={{ root: 'px-0 pt-0' }}>
        {signedOut}
      </ViewShell>
    );
  }

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
          <CardGrid className="grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
            {favoriteChannels.map((ch) => (
              <div key={ch.slug} className="flex flex-col gap-2">
                <Link to="/channel/$slug" params={{ slug: ch.slug }}>
                  <Card
                    title={ch.displayName}
                    subtitle={ch.slug}
                    src={ch.avatarUrl ?? placeholderArtworkUrl(ch.slug)}
                  />
                </Link>
                <MediaIconActions
                  className="px-1"
                  actions={playQueueFavoriteActions({
                    onPlay: () => {
                      void fetchChannel(ch.slug).then(({ playable }) => {
                        if (playable) {
                          play(playable);
                        }
                      });
                    },
                    onTogglePause: () =>
                      setPlayerStatus(
                        playerStatus === 'playing' || playerStatus === 'loading'
                          ? 'paused'
                          : 'playing',
                      ),
                    // A channel's live playable id is always `live:<slug>`
                    // (see api/client.ts's fetchChannel), so this is
                    // knowable without fetching first.
                    isPlaying:
                      currentId === `live:${ch.slug}` &&
                      (playerStatus === 'playing' ||
                        playerStatus === 'loading'),
                    onQueue: () => {
                      void fetchChannel(ch.slug).then(({ playable }) => {
                        if (playable) {
                          enqueue(playable);
                        }
                      });
                    },
                    onFavorite: () => toggleFavoriteChannel(ch),
                    favorited: true,
                    queueLabel: 'Queue channel',
                  })}
                />
              </div>
            ))}
            {radioFavorites.map((radio) => (
              <div key={radio.id} className="flex flex-col gap-2">
                <Link to="/radio">
                  <Card
                    title={radio.artist || radio.title}
                    src={radio.coverUrl ?? placeholderArtworkUrl(radio.id)}
                  />
                </Link>
                <MediaIconActions
                  className="px-1"
                  actions={playQueueFavoriteActions({
                    onPlay: () => play(radio),
                    onTogglePause: () =>
                      setPlayerStatus(
                        playerStatus === 'playing' || playerStatus === 'loading'
                          ? 'paused'
                          : 'playing',
                      ),
                    isPlaying:
                      radio.id === currentId &&
                      (playerStatus === 'playing' ||
                        playerStatus === 'loading'),
                    onQueue: () => enqueue(radio),
                    onFavorite: () =>
                      useLibraryStore.getState().toggleFavoriteTrack(radio),
                    favorited: true,
                    queueLabel: 'Queue station',
                  })}
                />
              </div>
            ))}
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
