import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button, ExternalLink, ImageReveal } from '@tahti-player/ui';

import {
  fetchEmbedChannel,
  fetchEmbedCollection,
  fetchEmbedRelease,
  type FetchMeta,
} from '../api/client';
import type {
  ChannelEmbedView,
  CollectionEmbedView,
  ReleaseEmbedView,
  TahtiPlayable,
} from '../api/types';
import { AudioEngine } from '../components/AudioEngine';
import { ConnectedPlayerBar } from '../components/ConnectedPlayerBar';
import { HearthisEmbedHostProvider } from '../components/HearthisEmbedHost';
import { ListenHeartbeat } from '../components/ListenHeartbeat';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { useThemeStore } from '../plugins/themes';
import { usePlayerStore } from '../stores/playerStore';

function EmbedChrome({ children }: { children: ReactNode }) {
  useEffect(() => {
    useThemeStore.getState().init();
  }, []);

  return (
    <HearthisEmbedHostProvider>
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <AudioEngine />
        <ListenHeartbeat />
        <main className="flex-1 p-3">{children}</main>
        <ConnectedPlayerBar />
      </div>
    </HearthisEmbedHostProvider>
  );
}

function useEmbedLoad<R extends { meta: FetchMeta }>(
  load: () => Promise<R>,
  key: string,
) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadRef
      .current()
      .then((res) => {
        if (cancelled) {
          return;
        }
        setResult(res);
        setError(res.meta.source === 'api' ? (res.meta.reason ?? null) : null);
      })
      .catch((err) => {
        if (!cancelled) {
          setResult(null);
          setError(
            err instanceof Error ? err.message : 'Could not load this embed.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  return {
    result,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}

function EmbedLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <PageError
      title="Could not load this embed"
      description={message}
      onRetry={onRetry}
    />
  );
}

export function EmbedChannelView({ slug }: { slug: string }) {
  const { result, loading, error, retry } = useEmbedLoad(
    () => fetchEmbedChannel(slug),
    slug,
  );
  const data: ChannelEmbedView | null = error ? null : (result?.data ?? null);
  const playable: TahtiPlayable | null = result?.playable ?? null;
  const play = usePlayerStore((s) => s.play);
  const status = usePlayerStore((s) => s.status);
  const isPlaying = status === 'playing' || status === 'loading';

  return (
    <EmbedChrome>
      {loading && <PageLoading label="Loading embed…" />}
      {!loading && error && <EmbedLoadError message={error} onRetry={retry} />}
      {!loading && !error && !data && <PageEmpty title="Channel unavailable" />}
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
              <h1 className="font-display truncate text-base font-bold">
                {data.artist.displayName}
              </h1>
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
              <ExternalLink
                href={`https://tahti.live/c/${data.slug}`}
                className="text-foreground-secondary text-xs"
              >
                Open channel
              </ExternalLink>
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
  const { result, loading, error, retry } = useEmbedLoad(
    () => fetchEmbedRelease(id),
    id,
  );
  const data: ReleaseEmbedView | null = error ? null : (result?.data ?? null);
  const playables: TahtiPlayable[] = result?.playables ?? [];
  const play = usePlayerStore((s) => s.play);

  return (
    <EmbedChrome>
      {loading && <PageLoading label="Loading embed…" />}
      {!loading && error && <EmbedLoadError message={error} onRetry={retry} />}
      {!loading && !error && !data && <PageEmpty title="Release unavailable" />}
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
              <h1 className="font-display truncate text-base font-bold">
                {data.title}
              </h1>
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
            <ExternalLink
              href={`https://tahti.live/r/${data.smartLinkSlug}`}
              className="text-foreground-secondary text-xs"
            >
              Open smart link
            </ExternalLink>
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
  const { result, loading, error, retry } = useEmbedLoad(
    () => fetchEmbedCollection(slug),
    slug,
  );
  const data: CollectionEmbedView | null = error
    ? null
    : (result?.data ?? null);
  const playables: TahtiPlayable[] = result?.playables ?? [];
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  const artistUsername = data?.artist.username ?? username;

  return (
    <EmbedChrome>
      {loading && <PageLoading label="Loading embed…" />}
      {!loading && error && <EmbedLoadError message={error} onRetry={retry} />}
      {!loading && !error && !data && (
        <PageEmpty title="Collection unavailable" />
      )}
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
              <h1 className="font-display truncate text-base font-bold">
                {data.name}
              </h1>
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
            <ExternalLink
              href={`https://tahti.live/u/${artistUsername}/c/${data.slug}`}
              className="text-foreground-secondary text-xs"
            >
              Open collection
            </ExternalLink>
          )}
        </div>
      )}
    </EmbedChrome>
  );
}
