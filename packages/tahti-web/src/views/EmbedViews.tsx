import { useEffect, useState, type ReactNode } from 'react';

import { Button, ImageReveal } from '@tahti-player/ui';

import {
  fetchEmbedChannel,
  fetchEmbedCollection,
  fetchEmbedRelease,
} from '../api/client';
import type {
  ChannelEmbedView,
  CollectionEmbedView,
  ReleaseEmbedView,
  TahtiPlayable,
} from '../api/types';
import { AudioEngine } from '../components/AudioEngine';
import { ConnectedPlayerBar } from '../components/ConnectedPlayerBar';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { useThemeStore } from '../plugins/themes';
import { usePlayerStore } from '../stores/playerStore';

function EmbedChrome({ children }: { children: ReactNode }) {
  useEffect(() => {
    useThemeStore.getState().init();
  }, []);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <AudioEngine />
      <div className="flex-1 p-3">{children}</div>
      <ConnectedPlayerBar />
    </div>
  );
}

export function EmbedChannelView({ slug }: { slug: string }) {
  const [data, setData] = useState<ChannelEmbedView | null>(null);
  const [playable, setPlayable] = useState<TahtiPlayable | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore((s) => s.play);
  const status = usePlayerStore((s) => s.status);
  const isPlaying = status === 'playing' || status === 'loading';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEmbedChannel(slug).then((res) => {
      if (cancelled) {
        return;
      }
      setData(res.data);
      setPlayable(res.playable);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <EmbedChrome>
      {loading && <PageLoading label="Loading embed…" />}
      {!loading && !data && <PageEmpty title="Channel unavailable" />}
      {!loading && data && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {data.artist.avatarUrl ? (
              <ImageReveal
                src={data.artist.avatarUrl}
                alt=""
                className="border-border h-10 w-10 rounded-full border"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-base font-bold">
                {data.artist.displayName}
              </p>
              <p className="text-foreground-secondary truncate text-xs">
                @{data.artist.username}
                {data.state === 'LIVE' ? ' — LIVE' : ' — offline'}{' '}
              </p>
            </div>
            {playable ? (
              <Button size="sm" onClick={() => play(playable)}>
                {isPlaying ? 'Playing' : 'Play'}
              </Button>
            ) : (
              <a
                href={`https://tahti.live/c/${data.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-foreground-secondary text-xs underline"
              >
                Open channel
              </a>
            )}
          </div>
          {!playable && (
            <p className="text-foreground-secondary text-xs">
              Not live right now — open the full channel for archive playback.
            </p>
          )}
        </div>
      )}
    </EmbedChrome>
  );
}

export function EmbedReleaseView({ id }: { id: string }) {
  const [data, setData] = useState<ReleaseEmbedView | null>(null);
  const [playables, setPlayables] = useState<TahtiPlayable[]>([]);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore((s) => s.play);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEmbedRelease(id).then((res) => {
      if (cancelled) {
        return;
      }
      setData(res.data);
      setPlayables(res.playables);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <EmbedChrome>
      {loading && <PageLoading label="Loading embed…" />}
      {!loading && !data && <PageEmpty title="Release unavailable" />}
      {!loading && data && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {data.artworkUrl ? (
              <ImageReveal
                src={data.artworkUrl}
                alt=""
                className="border-border h-14 w-14 rounded border"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-base font-bold">
                {data.title}
              </p>
              <p className="text-foreground-secondary truncate text-xs">
                {data.artist.displayName}{' '}
              </p>
            </div>
            {playables[0] && (
              <Button
                size="sm"
                onClick={() =>
                  play(playables[0]!, { enqueueRest: playables.slice(1) })
                }
              >
                Play
              </Button>
            )}
          </div>
          <ol className="text-foreground-secondary space-y-1 text-xs">
            {data.tracks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">
                  {t.position}. {t.title}
                </span>
                {playables.find((p) => p.id === `sound:${t.id}`) && (
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => {
                      const p = playables.find((x) => x.id === `sound:${t.id}`);
                      if (p) {
                        play(p);
                      }
                    }}
                  >
                    Play
                  </Button>
                )}
              </li>
            ))}
          </ol>
          {data.smartLinkSlug && (
            <a
              href={`https://tahti.live/r/${data.smartLinkSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-secondary text-xs underline"
            >
              Open smart link
            </a>
          )}
        </div>
      )}
    </EmbedChrome>
  );
}

export function EmbedCollectionView({
  slug,
  username,
}: {
  slug: string;
  username?: string;
}) {
  const [data, setData] = useState<CollectionEmbedView | null>(null);
  const [playables, setPlayables] = useState<TahtiPlayable[]>([]);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEmbedCollection(slug).then((res) => {
      if (cancelled) {
        return;
      }
      setData(res.data);
      setPlayables(res.playables);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const artistUsername = data?.artist.username ?? username;

  return (
    <EmbedChrome>
      {loading && <PageLoading label="Loading embed…" />}
      {!loading && !data && <PageEmpty title="Collection unavailable" />}
      {!loading && data && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {data.coverUrl ? (
              <ImageReveal
                src={data.coverUrl}
                alt=""
                className="border-border h-14 w-14 rounded border"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-base font-bold">
                {data.name}
              </p>
              <p className="text-foreground-secondary truncate text-xs">
                {data.artist.displayName}{' '}
              </p>
            </div>
            <div className="flex gap-1">
              {playables[0] && (
                <Button
                  size="sm"
                  onClick={() =>
                    play(playables[0]!, { enqueueRest: playables.slice(1) })
                  }
                >
                  Play
                </Button>
              )}
              {playables.length > 1 && (
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => {
                    for (const p of playables) {
                      enqueue(p);
                    }
                  }}
                >
                  Queue
                </Button>
              )}
            </div>
          </div>
          <ol className="text-foreground-secondary space-y-1 text-xs">
            {data.tracks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{t.title}</span>
                {playables.find((p) => p.id === `sound:${t.id}`) && (
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => {
                      const p = playables.find((x) => x.id === `sound:${t.id}`);
                      if (p) {
                        play(p, {
                          enqueueRest: playables.filter((x) => x.id !== p.id),
                        });
                      }
                    }}
                  >
                    Play
                  </Button>
                )}
              </li>
            ))}
          </ol>
          {artistUsername && (
            <a
              href={`https://tahti.live/u/${artistUsername}/c/${data.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-secondary text-xs underline"
            >
              Open collection
            </a>
          )}
        </div>
      )}
    </EmbedChrome>
  );
}
