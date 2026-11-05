import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, ViewShell } from '@tahti-player/ui';

import { fetchTracksByTag } from '../api/listen';
import { isForceMock } from '../api/mode';
import type { SearchTrackResult } from '../api/types';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { SearchTrackResults } from '../components/SearchTrackResults';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; tracks: SearchTrackResult[] };

/** `/search?tag=` - public tracks carrying one tag, reached from the tag
 * chips on a track page. */
export function TagSearchView({ tag }: { tag?: string }) {
  const { t } = useTranslation('web');
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
          title={t('empties.noTagChosen')}
          description={t('empties.openATagOnATrack')}
        />
      ) : state.status === 'loading' ? (
        <PageLoading />
      ) : state.status === 'error' ? (
        <PageError
          title={t('loadErrors.couldnTLoadTracksForThis')}
          description={state.error}
          onRetry={() => load()}
        />
      ) : state.tracks.length === 0 ? (
        <PageEmpty
          title={
            isForceMock()
              ? `No tracks tagged “${trimmed}” in mock fixtures`
              : `No public tracks tagged “${trimmed}” yet`
          }
          description={t('empties.tryATagFromATrack')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ButtonLink to="/discover" size="sm" variant="secondary">
                Discover
              </ButtonLink>
              <ButtonLink to="/radio" size="sm" variant="secondary">
                Radio
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <div className="w-full pb-8">
          <SearchTrackResults tracks={state.tracks} />
        </div>
      )}
    </ViewShell>
  );
}
