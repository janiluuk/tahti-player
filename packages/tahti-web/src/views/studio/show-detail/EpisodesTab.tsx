import { useTranslation } from '@tahti-player/i18n';

import { PageEmpty, PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { EpisodeEditorRow } from './EpisodeEditorRow';
import type { ShowDetailState } from './useShowDetail';

export function EpisodesTab({ state }: { state: ShowDetailState }) {
  const { t } = useTranslation('web');
  const { episodes, setEpisodes, episodesLoadError, reload } = state;

  return (
    <StudioPanel
      title="All episodes"
      description="Edit every episode and review its publishing and listening metadata."
    >
      {episodesLoadError ? (
        <PageError
          title={t('loadErrors.couldNotLoadEpisodes')}
          description={episodesLoadError}
          onRetry={reload}
        />
      ) : episodes.length === 0 ? (
        <PageEmpty title={t('empties.noShowEpisodes')} />
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
