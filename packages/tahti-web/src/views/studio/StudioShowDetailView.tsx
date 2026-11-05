import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Tooltip,
} from '@tahti-player/ui';

import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { useEditMode } from '../../lib/useEditMode';
import { EpisodesTab } from './show-detail/EpisodesTab';
import { NewEpisodeDialog } from './show-detail/NewEpisodeDialog';
import { OverviewTab } from './show-detail/OverviewTab';
import { RecordingsTab } from './show-detail/RecordingsTab';
import { ShowHeader } from './show-detail/ShowHeader';
import { useShowDetail } from './show-detail/useShowDetail';

export function StudioShowDetailView({ id }: { id: string }) {
  const { t } = useTranslation('web');
  const state = useShowDetail(id);
  const { show, loaded, showLoadError, showTab, msg, reload } = state;
  const [editing, setEditing] = useEditMode();

  return (
    <StudioGate>
      <div
        className="studio-page-layout relative flex w-full flex-col gap-6 px-1 py-2"
        data-testid="studio-page-layout"
      >
        <Tooltip
          content="Back to Shows"
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink to="/studio/shows" aria-label="Back to Shows" />
        </Tooltip>

        {!show ? (
          <StudioPanel>
            {!loaded ? (
              <PageLoading label="Loading…" />
            ) : showLoadError ? (
              <PageError
                title="Could not load this show"
                description={showLoadError}
                onRetry={reload}
              />
            ) : (
              <PageEmpty headingLevel={1} title={t('empties.showNotFound')} />
            )}
          </StudioPanel>
        ) : (
          <>
            <ShowHeader
              show={show}
              state={state}
              editing={editing}
              onEditingChange={(next) => {
                if (next && showTab !== 'overview') {
                  state.setShowTab('overview', true);
                } else {
                  setEditing(next);
                }
              }}
            />

            {showTab === 'overview' ? (
              <OverviewTab show={show} state={state} editing={editing} />
            ) : showTab === 'episodes' ? (
              <EpisodesTab state={state} />
            ) : (
              <RecordingsTab state={state} />
            )}

            <NewEpisodeDialog show={show} state={state} />

            {msg && <p className="text-sm">{msg}</p>}
          </>
        )}
      </div>
    </StudioGate>
  );
}
