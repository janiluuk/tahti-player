import { ButtonLink, ViewShell } from '@tahti-player/ui';

import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { RecordingsPanel } from './recordings/RecordingsPanel';
import { useRecordingsState } from './recordings/useRecordingsState';

export function StudioRecordingsView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const state = useRecordingsState();

  const browseShowsAction = (
    <ButtonLink to="/studio/shows" size="sm" variant="secondary">
      Browse shows
    </ButtonLink>
  );

  const content = (
    <div
      className={`${embedded ? 'flex' : 'studio-page-layout'} mx-auto w-full max-w-3xl flex-col gap-6 px-1 py-2`}
    >
      {!embedded ? <StudioNav current="/studio/recordings" /> : null}
      {!embedded ? (
        <ViewShell title="Recordings" classes={{ root: 'px-0 pt-0' }}>
          <div className="mb-4">{browseShowsAction}</div>
          <RecordingsPanel state={state} />
        </ViewShell>
      ) : (
        <RecordingsPanel state={state} action={browseShowsAction} />
      )}
    </div>
  );

  return embedded ? (
    content
  ) : (
    <StudioGate requireChannel={false}>{content}</StudioGate>
  );
}
