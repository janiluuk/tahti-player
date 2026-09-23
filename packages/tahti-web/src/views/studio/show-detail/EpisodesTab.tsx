import { StudioPanel } from '../../../components/StudioPanel';
import { EpisodeEditorRow } from './EpisodeEditorRow';
import type { ShowDetailState } from './useShowDetail';

export function EpisodesTab({ state }: { state: ShowDetailState }) {
  const { episodes, setEpisodes } = state;

  return (
    <StudioPanel
      title="All episodes"
      description="Edit every episode and review its publishing and listening metadata."
    >
      {episodes.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No episodes have been created for this show yet.
        </p>
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
