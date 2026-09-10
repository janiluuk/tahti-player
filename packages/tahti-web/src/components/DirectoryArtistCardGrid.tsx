import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Badge, Card, CardGrid } from '@tahti-player/ui';

import { fetchArtistPlayables } from '../api/client';
import {
  isDirectoryArtistActive,
  type ChannelDirectoryItem,
  type TahtiPlayable,
} from '../api/types';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { QueueConfirmDialog } from './QueueConfirmDialog';

type DirectoryArtistCardGridProps = {
  artists: ChannelDirectoryItem[];
  /** Discover uses a Live pill; Listen uses “Active ·” in the subtitle. */
  liveIndicator?: 'text' | 'badge';
};

/** Soft avatar wash behind the whole grid (not per-card). Opaque Nuclear
 * Cards leave almost no gutter for a per-card blur bleed; a page-level
 * collage + wider gap is the ambient technique that reads as glow. */
function GridAmbientWash({ artists }: { artists: ChannelDirectoryItem[] }) {
  const sources = artists.slice(0, 12).map((artist) => ({
    slug: artist.slug,
    src: artist.avatarUrl ?? placeholderArtworkUrl(artist.username),
  }));
  if (sources.length === 0) {
    return null;
  }
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {sources.map((item, index) => (
        <img
          key={item.slug}
          src={item.src}
          alt=""
          className="absolute size-48 rounded-full object-cover opacity-35 blur-3xl saturate-150"
          style={{
            left: `${(index % 4) * 28}%`,
            top: `${Math.floor(index / 4) * 36}%`,
            transform: 'translate(-15%, -15%)',
          }}
        />
      ))}
    </div>
  );
}

export function DirectoryArtistCardGrid({
  artists,
  liveIndicator = 'text',
}: DirectoryArtistCardGridProps) {
  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const favoriteChannels = useLibraryStore((s) => s.favoriteChannels);
  const [queueConfirm, setQueueConfirm] = useState<{
    displayName: string;
    playables: TahtiPlayable[];
  } | null>(null);

  const playArtist = async (username: string) => {
    const { data } = await fetchArtistPlayables(username);
    const [first, ...rest] = data;
    if (first) {
      play(first, { enqueueRest: rest });
    }
  };

  const queueArtist = async (username: string, displayName: string) => {
    const { data } = await fetchArtistPlayables(username);
    if (data.length === 0) {
      return;
    }
    if (data.length > 1) {
      setQueueConfirm({ displayName, playables: data });
      return;
    }
    enqueue(data[0]);
  };

  return (
    <>
      <div className="relative" data-testid="directory-artist-ambient">
        <GridAmbientWash artists={artists} />
        <CardGrid
          className="gap-6 sm:gap-8"
          data-testid="directory-artist-card-grid"
        >
          {artists.map((artist) => {
            const favorited =
              signedIn && favoriteChannels.some((c) => c.slug === artist.slug);
            const live = isDirectoryArtistActive(artist);
            const genreLine =
              artist.genres.slice(0, 2).join(', ') || `@${artist.username}`;
            return (
              <Card
                key={artist.slug}
                title={
                  <Link
                    to="/u/$username"
                    params={{ username: artist.username }}
                    className="hover:underline"
                  >
                    {artist.displayName}
                  </Link>
                }
                subtitle={
                  liveIndicator === 'badge' ? (
                    <span className="flex items-center gap-1.5">
                      {live ? (
                        <Badge
                          variant="pill"
                          color="cyan"
                          className="px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase"
                        >
                          Live
                        </Badge>
                      ) : null}
                      <span>{genreLine}</span>
                    </span>
                  ) : (
                    <span className="font-mono">
                      {live ? 'Active · ' : ''}
                      {genreLine}
                    </span>
                  )
                }
                src={artist.avatarUrl ?? placeholderArtworkUrl(artist.username)}
                onPlay={() => void playArtist(artist.username)}
                onQueue={() =>
                  void queueArtist(artist.username, artist.displayName)
                }
                onFavorite={
                  signedIn
                    ? () =>
                        toggleFavoriteChannel({
                          slug: artist.slug,
                          displayName: artist.displayName,
                          avatarUrl: artist.avatarUrl,
                        })
                    : undefined
                }
                favorited={favorited}
                onClick={() => {
                  void navigate({
                    to: '/u/$username',
                    params: { username: artist.username },
                  });
                }}
              />
            );
          })}
        </CardGrid>
      </div>
      <QueueConfirmDialog
        isOpen={Boolean(queueConfirm)}
        count={queueConfirm?.playables.length ?? 0}
        sourceLabel={queueConfirm?.displayName ?? ''}
        onCancel={() => setQueueConfirm(null)}
        onConfirm={() => {
          if (queueConfirm) {
            for (const item of queueConfirm.playables) {
              enqueue(item);
            }
          }
          setQueueConfirm(null);
        }}
      />
    </>
  );
}
