import { EmptyState, ViewShell } from '@tahti-player/ui';

import { AddToMusicActions } from '../../components/AddToMusicActions';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { LibrarySectionTabs } from '../LibraryView';
import { SoundFilters } from './sounds/SoundFilters';
import { SoundsDialogs } from './sounds/SoundsDialogs';
import { SoundsList } from './sounds/SoundsList';
import { SoundsSelectionBar } from './sounds/SoundsSelectionBar';
import { TrackOrderButton } from './sounds/TrackOrderButton';
import { useStudioSoundsState } from './sounds/useStudioSoundsState';

export function StudioSoundsView() {
  const state = useStudioSoundsState();
  const { reload, loading, filtered } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <LibrarySectionTabs active="sounds" />
        <ViewShell title="Sounds" classes={{ root: 'px-0 pt-0' }}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <AddToMusicActions onUploaded={reload} />
            <TrackOrderButton />
          </div>

          <StudioPanel>
            <SoundFilters state={state} />
            {loading ? (
              <PageLoading label="Loading…" />
            ) : filtered.length === 0 ? (
              <EmptyState
                size="sm"
                title="No sounds yet"
                description="Upload a file or import from Sources. Sounds can be tracks, clips, DJ sets, shows, or episodes."
                action={
                  <AddToMusicActions
                    align="center"
                    uploadTo="/library/upload"
                  />
                }
              />
            ) : (
              <>
                <SoundsSelectionBar state={state} />
                <SoundsList items={filtered} state={state} />
              </>
            )}
          </StudioPanel>
        </ViewShell>
        <SoundsDialogs state={state} />
      </div>
    </StudioGate>
  );
}
