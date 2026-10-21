import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { MediaArtwork, SectionTitle, ViewShell } from '@tahti-player/ui';

import { fetchSearch } from '../api/listen';
import type { SearchResponse } from '../api/search-types';
import { GlobalSearch } from '../components/GlobalSearch';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { placeholderArtworkUrl } from '../lib/placeholderArt';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: SearchResponse };

function duration(sec: number | null): string | null {
  if (sec == null) {
    return null;
  }
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const rowClass =
  'hover:bg-background-secondary flex min-w-0 items-center gap-3 rounded-md p-2';

/** Every artist, track and playlist matching `q` — where Enter in the top
 * bar search goes. Without a query it offers the search box. */
export function SearchResultsView({ q }: { q: string }) {
  const query = q.trim();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!query) {
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    void fetchSearch(query)
      .then(({ data, meta }) => {
        if (cancelled) {
          return;
        }
        const reason = meta.source === 'api' ? (meta.reason ?? null) : null;
        setState(
          reason
            ? { status: 'error', message: reason }
            : { status: 'ready', data },
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error ? err.message : 'Could not run this search.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, attempt]);

  return (
    <ViewShell
      title={query ? `Results for “${query}”` : 'Search'}
      data-testid="search-results-view"
    >
      {!query ? (
        <div className="max-w-xl">
          <GlobalSearch fullWidth autoFocus />
        </div>
      ) : state.status === 'loading' ? (
        <PageLoading label="Searching…" />
      ) : state.status === 'error' ? (
        <PageError
          title="Could not load search results"
          description={state.message}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : state.data.artists.length +
          state.data.tracks.length +
          state.data.collections.length ===
        0 ? (
        <PageEmpty
          title={`No results for “${query}”`}
          description="Try another spelling, or browse Discover and Radio."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {state.data.artists.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle title="Artists" />
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {state.data.artists.map((artist) => (
                  <li key={artist.username}>
                    <Link
                      to="/u/$username"
                      params={{ username: artist.username }}
                      className={rowClass}
                    >
                      <MediaArtwork
                        size="sm"
                        src={
                          artist.avatarUrl ??
                          placeholderArtworkUrl(artist.username)
                        }
                        className="shrink-0 rounded-full"
                      />
                      <span className="min-w-0 truncate font-medium">
                        {artist.displayName}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {state.data.tracks.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle title="Tracks" />
              <ul className="flex flex-col gap-1">
                {state.data.tracks.map((track) => (
                  <li key={track.id}>
                    <Link
                      to="/t/$id"
                      params={{ id: track.id }}
                      className={rowClass}
                    >
                      <MediaArtwork
                        size="sm"
                        src={track.coverUrl ?? placeholderArtworkUrl(track.id)}
                        className="shrink-0"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">
                          {track.title}
                        </span>
                        <span className="text-foreground-secondary truncate text-xs">
                          {track.artistName}
                        </span>
                      </span>
                      <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                        {duration(track.durationSec)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {state.data.collections.length > 0 ? (
            <section className="flex flex-col gap-2">
              <SectionTitle title="Playlists and releases" />
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {state.data.collections.map((collection) => (
                  <li key={`${collection.ownerUsername}/${collection.slug}`}>
                    <Link
                      to="/u/$username/c/$slug"
                      params={{
                        username: collection.ownerUsername,
                        slug: collection.slug,
                      }}
                      className={rowClass}
                    >
                      <MediaArtwork
                        size="sm"
                        src={
                          collection.coverUrl ??
                          placeholderArtworkUrl(collection.slug)
                        }
                        className="shrink-0"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {collection.name}
                        </span>
                        <span className="text-foreground-secondary truncate text-xs">
                          {collection.ownerDisplayName}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </ViewShell>
  );
}
