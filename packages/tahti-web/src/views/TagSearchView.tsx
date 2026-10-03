import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { MediaArtwork, ViewShell } from '@tahti-player/ui';

import { fetchTracksByTag } from '../api/listen';
import type { SearchTrackResult } from '../api/types';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { formatDuration } from '../lib/playableToTrack';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; tracks: SearchTrackResult[] };

/** `/search?tag=` - public tracks carrying one tag, reached from the tag
 * chips on a track page. */
export function TagSearchView({ tag }: { tag?: string }) {
  const trimmed = tag?.trim() ?? '';
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(() => {
    if (!trimmed) {
      setState({ status: 'ready', tracks: [] });
      return () => {};
    }
    let cancelled = false;
    setState({ status: 'loading' });
    void fetchTracksByTag(trimmed).then((result) => {
      if (cancelled) {
        return;
      }
      setState(
        result.ok
          ? { status: 'ready', tracks: result.tracks }
          : { status: 'error', error: result.error },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  useEffect(() => load(), [load]);

  return (
    <ViewShell
      title={trimmed ? `#${trimmed}` : 'Search'}
      subtitle={trimmed ? 'Tracks with this tag' : undefined}
      data-testid="tag-search-view"
    >
      {!trimmed ? (
        <PageEmpty
          title="No tag chosen"
          description="Open a tag on a track page to see other tracks with it."
        />
      ) : state.status === 'loading' ? (
        <PageLoading />
      ) : state.status === 'error' ? (
        <PageError
          title="Couldn't load tracks for this tag"
          description={state.error}
          onRetry={() => load()}
        />
      ) : state.tracks.length === 0 ? (
        <PageEmpty title="No public tracks have this tag yet" />
      ) : (
        <ul className="flex w-full flex-col gap-1 pb-8">
          {state.tracks.map((track) => (
            <li key={track.id}>
              <Link
                to="/t/$id"
                params={{ id: track.id }}
                className="hover:bg-background-secondary flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5"
              >
                <MediaArtwork
                  size="thumb"
                  src={track.coverUrl}
                  alt=""
                  placeholder={
                    <span className="text-xs font-bold">
                      {track.title.slice(0, 2).toUpperCase()}
                    </span>
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {track.title}
                  </span>
                  <span className="text-foreground-secondary block truncate text-xs">
                    {track.artistName}
                  </span>
                </span>
                {track.durationSec != null ? (
                  <span className="text-foreground-secondary text-xs tabular-nums">
                    {formatDuration(track.durationSec)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ViewShell>
  );
}
