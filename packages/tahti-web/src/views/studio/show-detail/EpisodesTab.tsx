import { PlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { PageEmpty, PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { EpisodeEditorRow } from './EpisodeEditorRow';
import type { ShowDetailState } from './useShowDetail';

export function EpisodesTab({ state }: { state: ShowDetailState }) {
  const { t } = useTranslation('web');
  const { episodes, setEpisodes, episodesLoadError, reload, setCreateOpen } =
    state;

  return (
    <StudioPanel
      title={t('episodesTab.allEpisodes')}
      description={t('episodesTab.editEveryEpisodeAndReview')}
    >
      {episodesLoadError ? (
        <PageError
          title={t('loadErrors.couldNotLoadEpisodes')}
          description={episodesLoadError}
          onRetry={reload}
        />
      ) : episodes.length === 0 ? (
        <PageEmpty
          title={t('empties.noShowEpisodes')}
          action={
            state.show?.mode === 'SINGLE' ? undefined : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon size={16} aria-hidden />
                {t('emptyActions.newEpisode')}
              </Button>
            )
          }
        />
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
