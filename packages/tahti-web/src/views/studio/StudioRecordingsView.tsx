import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, ViewShell } from '@tahti-player/ui';

import { StudioGate } from '../../components/StudioGate';
import { LibrarySectionTabs } from '../LibraryView';
import { RecordingsPanel } from './recordings/RecordingsPanel';
import { useRecordingsState } from './recordings/useRecordingsState';

export function StudioRecordingsView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { t } = useTranslation('web');
  const state = useRecordingsState();

  const browseShowsAction = (
    <ButtonLink to="/studio/shows" size="sm" variant="secondary">
      {t('studioRecordings.browseShows')}
    </ButtonLink>
  );

  const content = (
    <div
      className={
        embedded
          ? 'flex w-full flex-col gap-6'
          : 'studio-page-layout mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-2'
      }
    >
      {!embedded ? (
        <>
          <LibrarySectionTabs active="recordings" />
          <ViewShell
            title={t('studioRecordings.title')}
            classes={{ root: 'px-0 pt-0' }}
          >
            <RecordingsPanel state={state} action={browseShowsAction} />
          </ViewShell>
        </>
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
