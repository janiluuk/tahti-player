import { Link } from '@tanstack/react-router';

import {
  Button,
  Card,
  CardGrid,
  SectionShell,
  ViewShell,
} from '@tahti-player/ui';

import { fetchChannel } from '../api/client';
import {
  MediaIconActions,
  playQueueFavoriteActions,
} from '../components/MediaIconActions';
import { PageEmpty } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

export function FavoritesView({ embedded = false }: { embedded?: boolean }) {
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

  const body = (
    <div className="flex flex-col gap-6">
      <SectionShell title="Channels">
        {favoriteChannels.length === 0 && radioFavorites.length === 0 ? (
          <PageEmpty
            title="No favorite channels"
            description="Heart one from Discover → Artists or a channel page."
            action={
              <Link to="/discover" search={{ tab: 'artists' }}>
                <Button size="sm" variant="secondary">
                  Browse artists
                </Button>
              </Link>
            }
          />
        ) : (
          <CardGrid>
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
        <PlayableTrackTable
          items={audioFavorites}
          emptyMessage="No favorite tracks yet. Heart rows in Sounds / Collections."
          playAll={false}
        />
      </SectionShell>
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
