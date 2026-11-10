import { Navigate } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ViewShell } from '@tahti-player/ui';

import { AddToMusicActions } from '../../components/AddToMusicActions';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { hasStudioAccess } from '../../lib/accountRoles';
import { useAuthStore } from '../../stores/authStore';
import { LibrarySectionTabs } from '../LibraryView';
import { SoundFilters } from './sounds/SoundFilters';
import { SoundsAmbientList } from './sounds/SoundsAmbientList';
import { SoundsDialogs } from './sounds/SoundsDialogs';
import { SoundsSelectionBar } from './sounds/SoundsSelectionBar';
import { SoundsStatsStrip } from './sounds/SoundsStatsStrip';
import { TrackOrderButton } from './sounds/TrackOrderButton';
import { useStudioSoundsState } from './sounds/useStudioSoundsState';

export function StudioSoundsView() {
  const { t } = useTranslation('web');
  const state = useStudioSoundsState();
  const listener = useAuthStore(
    (auth) =>
      Boolean(auth.user) && auth.profileLoaded && !hasStudioAccess(auth.user),
  );
  const {
    reload,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    loadError,
    items,
    filtered,
    clearFilters,
    filtersActive,
    total,
  } = state;

  if (listener) {
    return <Navigate to="/library" />;
  }

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <LibrarySectionTabs active="sounds" />
        <ViewShell
          title={t('library.soundsTitle')}
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <AddToMusicActions onUploaded={reload} />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={state.coversBusy || state.bulkBusy}
                onClick={() => state.backfillCovers()}
              >
                {state.coversBusy
                  ? t('library.coversBackfillBusy')
                  : t('library.coversBackfill')}
              </Button>
              <TrackOrderButton />
            </div>
          </div>

          <StudioPanel>
            <SoundFilters state={state} />
            {loadError && items.length > 0 ? (
              <PageErrorBanner
                title={t('library.soundsRefreshError')}
                description={loadError}
                onRetry={reload}
              />
            ) : null}
            {loading ? (
              <PageLoading label={t('settingsBody.loading')} />
            ) : loadError && items.length === 0 ? (
              <PageError
                title={t('library.soundsLoadError')}
                description={loadError}
                onRetry={reload}
              />
            ) : filtersActive && total === 0 ? (
              <PageEmpty
                title={t('library.soundsNoMatch')}
                action={
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    {t('library.clearFilters')}
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <PageEmpty
                title={t('library.soundsEmptyTitle')}
                description={t('library.soundsEmptyDescription')}
                action={
                  <AddToMusicActions
                    align="center"
                    uploadTo="/library/upload"
                  />
                }
              />
            ) : (
              <>
                <SoundsStatsStrip state={state} />
                <SoundsSelectionBar state={state} />
                <SoundsAmbientList items={filtered} state={state} />
                {hasMore ? (
                  <div className="mt-4 flex justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loadingMore}
                      onClick={loadMore}
                    >
                      {loadingMore
                        ? t('settingsBody.loading')
                        : t('actions.loadMore')}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </StudioPanel>
        </ViewShell>
        <SoundsDialogs state={state} />
      </div>
    </StudioGate>
  );
}
