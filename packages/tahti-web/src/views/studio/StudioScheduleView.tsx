import { PlusIcon } from 'lucide-react';

import { Button, ImageReveal, Tooltip, ViewShell } from '@tahti-player/ui';

import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  endAtFor,
  formatDate,
  formatTimeRange,
} from './schedule/schedule-helpers';
import { ScheduleAnalytics } from './schedule/ScheduleAnalytics';
import { ScheduledTimes } from './schedule/ScheduledTimes';
import { ScheduleEditorDialog } from './schedule/ScheduleEditorDialog';
import { useScheduleForm } from './schedule/useScheduleForm';

export function StudioScheduleView() {
  const form = useScheduleForm();
  const {
    shows,
    scheduledShows,
    scheduledTimes,
    pendingCancel,
    setPendingCancel,
    cancelEpisode,
    msg,
    openEditor,
    setEditorOpen,
  } = form;

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title="Schedule"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="Add next broadcast" side="top">
              <Button
                size="icon-sm"
                aria-label="Add next broadcast"
                onClick={() => setEditorOpen(true)}
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          }
        >
          <ScheduledTimes items={scheduledTimes} onEdit={openEditor} />

          {scheduledShows.length > 0 ? (
            <StudioPanel
              title="Scheduled show episodes"
              description="One-off and recurring episodes generated from your shows."
            >
              <ul className="divide-border divide-y">
                {scheduledShows.map((show) => {
                  const endAt = endAtFor(
                    show.startAt,
                    shows.find((series) => series.id === show.seriesId)
                      ?.intervalHours,
                  );
                  return (
                    <li
                      key={show.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {show.artworkUrl ? (
                          <ImageReveal
                            src={show.artworkUrl}
                            alt=""
                            className="size-16 shrink-0 rounded-lg"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {show.title}
                            {show.episodeNumber != null
                              ? ` · Episode ${show.episodeNumber}`
                              : ''}
                          </p>
                          <p className="text-foreground-secondary text-xs">
                            {formatDate(show.startAt)} at{' '}
                            {formatTimeRange(show.startAt, endAt)}
                            {show.venue ? ` · ${show.venue}` : ''}
                            {show.location ? `, ${show.location}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => setPendingCancel(show)}
                      >
                        Cancel
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </StudioPanel>
          ) : null}

          <ConfirmDialog
            isOpen={pendingCancel !== null}
            title={`Cancel "${pendingCancel?.title ?? 'this show'}"?`}
            description="The scheduled episode is removed from your schedule and the public channel."
            confirmLabel="Cancel episode"
            onCancel={() => setPendingCancel(null)}
            onConfirm={() => {
              const target = pendingCancel;
              setPendingCancel(null);
              if (target) {
                void cancelEpisode(target.id);
              }
            }}
          />

          <ScheduleAnalytics />

          <ChannelRadioPlaylistPanel />

          {msg && (
            <p className="text-foreground-secondary text-sm" role="status">
              {msg}
            </p>
          )}

          <ScheduleEditorDialog form={form} />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
