import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardGrid } from '@tahti-player/ui';

import { fetchCollection } from '../api/client';
import type { PublicCollection, TahtiPlayable } from '../api/types';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { soundIdFromPlayableId } from '../lib/soundId';
import { usePlayerStore } from '../stores/playerStore';
import { PageEmpty, PageLoading } from './PageStates';
import { PlayableTrackTable } from './PlayableTrackTable';

function collectionToPlayables(col: PublicCollection): TahtiPlayable[] {
  const out: TahtiPlayable[] = [];
  for (const item of col.items) {
    const sound = item.sound;
    if (!sound?.audioUrl) {
      continue;
    }
    const isHls = sound.audioUrl.includes('.m3u8');
    out.push({
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: sound.title,
      artist: col.user.displayName,
      coverUrl:
        sound.bannerUrl ??
        col.coverUrl ??
        placeholderArtworkUrl(`${col.slug}:${sound.id}`),
      streamUrl: sound.audioUrl,
      protocol: isHls ? 'hls' : 'https',
      channelSlug: sound.channel?.slug,
    });
  }
  return out;
}

type Props = {
  playlistSlug: string;
  display?: 'tracklist' | 'cards';
  editing?: boolean;
};

export function ChannelPlaylistBlock({
  playlistSlug,
  display = 'tracklist',
  editing,
}: Props) {
  const navigate = useNavigate();
  const play = usePlayerStore((state) => state.play);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void fetchCollection(playlistSlug)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setCollection(result.data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setCollection(null);
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playlistSlug]);

  const playables = useMemo(
    () => (collection ? collectionToPlayables(collection) : []),
    [collection],
  );

  if (loading) {
    return <PageLoading label="Loading playlist…" />;
  }

  if (failed || !collection) {
    return (
      <PageEmpty
        title="Playlist unavailable"
        description={
          editing
            ? 'This playlist could not be loaded. Pick another in widget settings.'
            : 'This playlist is private or was removed.'
        }
      />
    );
  }

  return (
    <section
      className="flex flex-col gap-3"
      data-testid="channel-playlist-block"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          {!editing ? (
            <h2 className="text-xl font-bold tracking-tight">
              {collection.name}
            </h2>
          ) : (
            <div className="text-sm font-bold tracking-tight">
              {collection.name}
            </div>
          )}
          {collection.description ? (
            <p className="text-foreground-secondary text-xs">
              {collection.description}
            </p>
          ) : null}
        </div>
        <Link
          to="/u/$username/c/$slug"
          params={{
            username: collection.user.username,
            slug: collection.slug,
          }}
          className="text-primary text-xs font-semibold underline-offset-2 hover:underline"
        >
          Open playlist →
        </Link>
      </div>
      {display === 'cards' ? (
        playables.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            This playlist has no playable tracks yet.
          </p>
        ) : (
          <CardGrid className="grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4">
            {playables.map((item) => {
              const soundId = soundIdFromPlayableId(item.id);
              const isCurrent = currentId === item.id;
              const isPlaying =
                isCurrent && (status === 'playing' || status === 'loading');
              return (
                <Card
                  key={item.id}
                  src={item.coverUrl ?? undefined}
                  title={item.title}
                  subtitle={item.artist}
                  isPlaying={isPlaying}
                  playLabel={`Play ${item.title}`}
                  pauseLabel={`Pause ${item.title}`}
                  onPlay={() => {
                    if (isCurrent) {
                      setStatus(isPlaying ? 'paused' : 'playing');
                      return;
                    }
                    play(item);
                  }}
                  onQueue={() => enqueue(item)}
                  queueLabel={`Queue ${item.title}`}
                  onTitleClick={
                    soundId
                      ? () => {
                          void navigate({
                            to: '/t/$id',
                            params: { id: soundId },
                          });
                        }
                      : undefined
                  }
                />
              );
            })}
          </CardGrid>
        )
      ) : (
        <PlayableTrackTable
          items={playables}
          emptyMessage="This playlist has no playable tracks yet."
        />
      )}
    </section>
  );
}
