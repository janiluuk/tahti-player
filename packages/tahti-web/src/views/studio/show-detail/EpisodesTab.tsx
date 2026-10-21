import { PageEmpty, PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { EpisodeEditorRow } from './EpisodeEditorRow';
import type { ShowDetailState } from './useShowDetail';

export function EpisodesTab({ state }: { state: ShowDetailState }) {
  const { episodes, setEpisodes, episodesLoadError, reload } = state;

  return (
    <StudioPanel
      title="All episodes"
      description="Edit every episode and review its publishing and listening metadata."
    >
      {episodesLoadError ? (
        <PageError
          title="Could not load episodes"
          description={episodesLoadError}
          onRetry={reload}
        />
      ) : episodes.length === 0 ? (
        <PageEmpty title="No episodes have been created for this show yet." />
      ) : (
        <ul className="flex flex-col gap-3">
          {episodes.map((episode) => (
            <EpisodeEditorRow
              key={episode.id}
              episode={episode}
              onSaved={(updated) =>
                setEpisodes((current) =>
                  current.map((item) =>
                    item.id === updated.id ? updated : item,
                  ),
                )
              }
            />
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
