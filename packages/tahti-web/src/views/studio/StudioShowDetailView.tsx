import { BackButtonLink, Tooltip } from '@tahti-player/ui';

import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { EpisodesTab } from './show-detail/EpisodesTab';
import { NewEpisodeDialog } from './show-detail/NewEpisodeDialog';
import { OverviewTab } from './show-detail/OverviewTab';
import { RecordingsTab } from './show-detail/RecordingsTab';
import { ShowHeader } from './show-detail/ShowHeader';
import { useShowDetail } from './show-detail/useShowDetail';

export function StudioShowDetailView({ id }: { id: string }) {
  const state = useShowDetail(id);
  const { show, loaded, showTab, msg } = state;

  return (
    <StudioGate>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        <Tooltip content="Back to Shows" side="right">
          <BackButtonLink
            to="/studio/shows"
            aria-label="Back to Shows"
            className="-mt-2"
          />
        </Tooltip>

        {!show ? (
          <StudioPanel>
            {loaded ? (
              <PageEmpty title="Show not found" />
            ) : (
              <PageLoading label="Loading…" />
            )}
          </StudioPanel>
        ) : (
          <>
            <ShowHeader show={show} state={state} />

            {showTab === 'overview' ? (
              <OverviewTab show={show} state={state} />
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
