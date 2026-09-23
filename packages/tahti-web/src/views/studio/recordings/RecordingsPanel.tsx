import { Link } from '@tanstack/react-router';
import { RadioIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, EmptyState, Input, Select } from '@tahti-player/ui';

import { PageLoading } from '../../../components/PageStates';
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
  const {
    recordings,
    loading,
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
        title={`Recordings (${recordings.length})`}
        description="Every completed show recording, grouped by show — drafts that haven't been published yet are pinned at the top."
        action={action}
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recordings…"
            aria-label="Search recordings"
            endAddon={<SearchIcon size={16} aria-hidden />}
          />
          <Select
            label="Sort recordings"
            value={sort}
            onValueChange={(value) => setSort(value as SortKey)}
            options={[
              { id: 'newest', label: 'Newest first' },
              { id: 'oldest', label: 'Oldest first' },
              { id: 'title', label: 'Title A–Z' },
            ]}
            className="sm:w-44"
          />
        </div>
        {loading ? (
          <PageLoading label="Loading…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            size="sm"
            title={
              recordings.length === 0
                ? 'No recorded shows yet'
                : 'No recordings match your search'
            }
            description={
              recordings.length === 0
                ? 'Enable recording when you go live and completed shows will appear here.'
                : undefined
            }
            action={
              recordings.length === 0 ? (
                <Link to="/studio/go-live">
                  <Button size="sm" variant="secondary">
                    <RadioIcon size={14} aria-hidden className="mr-1" />
                    Open broadcast studio
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {drafts.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                  Drafts · not yet published ({drafts.length})
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
