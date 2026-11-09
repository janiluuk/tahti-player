import { Link } from '@tanstack/react-router';
import { RadioIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, Input, SortMenuButton } from '@tahti-player/ui';

import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { TrackEditDialog } from '../../../components/TrackEditDialog';
import type { SortKey } from './helpers';
import { RecordingRow } from './RecordingRow';
import type { RecordingsState } from './useRecordingsState';

export function RecordingsPanel({
  state,
  action,
}: {
  state: RecordingsState;
  action?: ReactNode;
}) {
  const { t } = useTranslation('web');
  const {
    recordings,
    loading,
    loadError,
    query,
    setQuery,
    sort,
    setSort,
    filtered,
    drafts,
    groups,
    editingSoundId,
    setEditingSoundId,
    reload,
  } = state;

  return (
    <>
      <StudioPanel
        description={t('studioRecordings.panelSummary', {
          count: recordings.length,
        })}
        action={action}
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            enterKeyHint="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('studioRecordings.searchPlaceholder')}
            aria-label={t('studioRecordings.searchAria')}
            endAddon={<SearchIcon size={16} aria-hidden />}
          />
          <SortMenuButton
            label={t('studioRecordings.sortLabel')}
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            options={[
              { id: 'newest', label: t('studioRecordings.sortNewest') },
              { id: 'oldest', label: t('studioRecordings.sortOldest') },
              { id: 'title', label: t('studioRecordings.sortTitle') },
            ]}
            defaultValue="newest"
          />
        </div>
        {loading ? (
          <PageLoading label={t('studioRecordings.loading')} />
        ) : loadError && recordings.length === 0 ? (
          <PageError
            title={t('studioRecordings.loadError')}
            description={loadError}
            onRetry={reload}
          />
        ) : filtered.length === 0 ? (
          <PageEmpty
            title={
              recordings.length === 0
                ? t('studioRecordings.emptyTitle')
                : t('studioRecordings.emptySearch')
            }
            description={
              recordings.length === 0
                ? t('studioRecordings.emptyDescription')
                : undefined
            }
            action={
              recordings.length === 0 ? (
                <ButtonLink to="/studio/go-live" variant="secondary">
                  <RadioIcon size={14} aria-hidden className="mr-1" />
                  {t('studioRecordings.openBroadcast')}
                </ButtonLink>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setQuery('')}
                >
                  {t('actions.clearSearch')}
                </Button>
              )
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {drafts.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-primary-strong text-xs font-semibold tracking-wide uppercase">
                  {t('studioRecordings.draftsHeading', {
                    count: drafts.length,
                  })}
                </h3>
                <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                  {drafts.map((show, index) => (
                    <RecordingRow
                      key={show.id}
                      show={show}
                      index={index}
                      onEdit={setEditingSoundId}
                    />
                  ))}
                </ul>
              </div>
            ) : null}

            {groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {group.showId ? (
                    <Link
                      to="/studio/shows/$id"
                      params={{ id: group.showId }}
                      className="hover:underline"
                    >
                      {group.title}
                    </Link>
                  ) : (
                    group.title
                  )}{' '}
                  <span className="text-foreground-secondary font-normal">
                    ({group.items.length})
                  </span>
                </h3>
                <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                  {group.items.map((show, index) => (
                    <RecordingRow
                      key={show.id}
                      show={show}
                      index={index}
                      onEdit={setEditingSoundId}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </StudioPanel>
      <TrackEditDialog
        soundId={editingSoundId}
        onClose={() => setEditingSoundId(null)}
        onSaved={reload}
      />
    </>
  );
}
