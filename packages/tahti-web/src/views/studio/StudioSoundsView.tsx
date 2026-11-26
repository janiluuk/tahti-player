import { Navigate, useNavigate, useSearch } from '@tanstack/react-router';
import { ImageIcon, LinkIcon, ListOrderedIcon, Music2Icon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, OverflowMenu, Tabs, ViewShell } from '@tahti-player/ui';

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
import { LibraryEmbedsView } from '../LibraryEmbedsView';
import { SoundActiveFilterChips } from './sounds/SoundActiveFilterChips';
import { SoundFilters } from './sounds/SoundFilters';
import { SoundsAmbientList } from './sounds/SoundsAmbientList';
import { SoundsDialogs } from './sounds/SoundsDialogs';
import { SoundsSelectionBar } from './sounds/SoundsSelectionBar';
import { SoundsStatsStrip } from './sounds/SoundsStatsStrip';
import { TrackOrderDialog } from './sounds/TrackOrderDialog';
import { useStudioSoundsState } from './sounds/useStudioSoundsState';

type SoundsPanelTab = 'sounds' | 'embeds';

export function StudioSoundsView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    tab?: string;
    contentType?: string;
    folder?: string;
  };
  const panelTab: SoundsPanelTab =
    search.tab === 'embeds' ? 'embeds' : 'sounds';
  const state = useStudioSoundsState();
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const canOrderTracks = useAuthStore((auth) => Boolean(auth.user?.username));
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
    return <Navigate to="/library/favorites" />;
  }

  const setPanelTab = (next: SoundsPanelTab) => {
    void navigate({
      to: '/studio/sounds',
      search: (previous: unknown) => {
        const current =
          typeof previous === 'object' && previous !== null
            ? { ...(previous as Record<string, unknown>) }
            : {};
        if (next === 'embeds') {
          return { ...current, tab: 'embeds' };
        }
        const rest = { ...current };
        delete rest.tab;
        return rest;
      },
      replace: true,
    });
  };

  const soundsBody =
    loadError && items.length > 0 ? (
      <PageErrorBanner
        title={t('library.soundsRefreshError')}
        description={loadError}
        onRetry={reload}
      />
    ) : null;

  const soundsList = loading ? (
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
      action={<AddToMusicActions align="center" uploadTo="/studio/upload" />}
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
            {loadingMore ? t('settingsBody.loading') : t('actions.loadMore')}
          </Button>
        </div>
      ) : null}
    </>
  );

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('library.soundsTitle')}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <div
              className="flex flex-wrap items-center gap-2"
              data-testid="studio-sounds-actions"
            >
              <AddToMusicActions onUploaded={reload} />
              <OverflowMenu
                label={t('library.moreTrackActions')}
                items={[
                  {
                    id: 'covers',
                    label: state.coversBusy
                      ? t('library.coversBackfillBusy')
                      : t('library.coversBackfill'),
                    icon: <ImageIcon size={14} aria-hidden />,
                    disabled: state.coversBusy || state.bulkBusy,
                    onSelect: () => {
                      void state.backfillCovers();
                    },
                  },
                  ...(canOrderTracks
                    ? [
                        {
                          id: 'order',
                          label: t('library.trackOrderButton'),
                          icon: <ListOrderedIcon size={14} aria-hidden />,
                          onSelect: () => setTrackOrderOpen(true),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          }
        >
          <StudioPanel className="max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none">
            <Tabs
              className="min-w-0"
              listClassName="border-border mb-4 flex-wrap gap-1 border-b pb-2"
              selectedIndex={panelTab === 'embeds' ? 1 : 0}
              onChange={(index) =>
                setPanelTab(index === 1 ? 'embeds' : 'sounds')
              }
              items={[
                {
                  id: 'sounds',
                  label: t('library.soundsPanelSounds'),
                  icon: <Music2Icon size={14} />,
                  content: (
                    <div
                      className="flex flex-col gap-3"
                      data-testid="sounds-panel-sounds"
                    >
                      <SoundFilters state={state} />
                      <SoundActiveFilterChips state={state} />
                      {soundsBody}
                      {soundsList}
                    </div>
                  ),
                },
                {
                  id: 'embeds',
                  label: t('library.soundsPanelEmbeds'),
                  icon: <LinkIcon size={14} />,
                  content: (
                    <div data-testid="sounds-panel-embeds">
                      <LibraryEmbedsView />
                    </div>
                  ),
                },
              ]}
            />
          </StudioPanel>
        </ViewShell>
        <SoundsDialogs state={state} />
        <TrackOrderDialog
          isOpen={trackOrderOpen}
          onClose={() => setTrackOrderOpen(false)}
        />
      </div>
    </StudioGate>
  );
}
