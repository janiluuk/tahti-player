import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  Clock3Icon,
  ListIcon,
  MapPinIcon,
  PencilIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, ImageReveal, Tooltip } from '@tahti-player/ui';

import {
  formatDate,
  formatTimeRange,
  type ScheduleCard,
} from './schedule-helpers';

export function ScheduledTimes({
  items,
  onEdit,
}: {
  items: ScheduleCard[];
  onEdit: () => void;
}) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [selectedShow, setSelectedShow] = useState<ScheduleCard | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  return (
    <section className="border-border bg-background-secondary/40 overflow-hidden rounded-xl border shadow-sm">
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon size={18} className="text-primary" aria-hidden />
          <h2 className="font-display font-bold">Your next broadcasts</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="border-border flex gap-1 rounded-md border p-0.5"
            role="group"
            aria-label="Schedule view"
          >
            <Tooltip content="Card view" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label="Card view"
                aria-pressed={viewMode === 'cards'}
                className={
                  viewMode === 'cards' ? 'bg-primary/15 text-primary' : ''
                }
                onClick={() => setViewMode('cards')}
              >
                <CalendarDaysIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="List view" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={
                  viewMode === 'list' ? 'bg-primary/15 text-primary' : ''
                }
                onClick={() => setViewMode('list')}
              >
                <ListIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </div>
          <span className="text-foreground-secondary text-xs">{timezone}</span>
        </div>
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-5">
          <p className="text-sm font-medium">Nothing scheduled yet</p>
          <p className="text-foreground-secondary mt-1 text-xs">
            Pick a local date and time below to tell listeners when you return.
          </p>
        </div>
      ) : (
        <ol
          className={
            viewMode === 'list'
              ? 'divide-border divide-y'
              : 'bg-border grid gap-px sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {items
            .slice(0, viewMode === 'list' ? undefined : 3)
            .map((item, index) => (
              <li
                key={item.id}
                className={
                  viewMode === 'list'
                    ? 'bg-background overflow-hidden'
                    : 'bg-background overflow-hidden'
                }
              >
                <div
                  className={
                    item.artworkUrl || item.backdropUrl
                      ? 'relative h-24 w-full bg-cover bg-center'
                      : 'from-primary/40 via-accent-cyan/25 to-background-secondary relative h-24 w-full bg-gradient-to-br'
                  }
                  style={
                    item.artworkUrl || item.backdropUrl
                      ? {
                          backgroundImage: `url(${item.backdropUrl ?? item.artworkUrl})`,
                        }
                      : undefined
                  }
                  aria-hidden
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className={viewMode === 'list' ? 'p-3' : 'p-4'}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-primary shrink-0 text-xs font-bold tracking-wide uppercase">
                        {index === 0 ? 'Next' : `Upcoming ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        className="text-primary min-w-0 truncate text-left text-sm font-semibold hover:underline"
                        onClick={() => setSelectedShow(item)}
                      >
                        {item.title}
                      </button>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.visibility === 'FAN_ONLY' ? (
                        <span className="text-foreground-secondary text-[10px] uppercase">
                          Fans only
                        </span>
                      ) : null}
                      {index === 0 ? (
                        <Tooltip content="Edit next broadcast" side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label="Edit next broadcast"
                            onClick={onEdit}
                          >
                            <PencilIcon size={14} aria-hidden />
                          </Button>
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-foreground-secondary mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDaysIcon size={13} aria-hidden />
                      {formatDate(item.startAt)}
                    </span>
                    <span className="text-foreground inline-flex items-center gap-1 font-medium">
                      <Clock3Icon size={13} aria-hidden />
                      {formatTimeRange(item.startAt, item.endAt)}
                    </span>
                  </div>
                  {item.location ? (
                    <p className="text-foreground-secondary mt-2 flex items-center gap-1 truncate text-xs">
                      <MapPinIcon size={13} aria-hidden />
                      {item.location}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
        </ol>
      )}
      <Dialog.Root
        isOpen={selectedShow !== null}
        onClose={() => setSelectedShow(null)}
        className="max-w-xl"
      >
        {selectedShow ? (
          <>
            <div className="border-border bg-background-secondary relative -mx-6 -mt-6 mb-5 h-40 overflow-hidden border-b">
              {selectedShow.backdropUrl || selectedShow.artworkUrl ? (
                <ImageReveal
                  src={
                    selectedShow.backdropUrl ?? selectedShow.artworkUrl ?? ''
                  }
                  alt=""
                  className="h-full w-full"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            <Dialog.Title>{selectedShow.title}</Dialog.Title>
            <Dialog.Description>
              {selectedShow.tagline ?? 'Upcoming broadcast'}
              {selectedShow.episodeNumber != null
                ? ` · Episode ${selectedShow.episodeNumber}`
                : ''}
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-4">
              {selectedShow.artworkUrl ? (
                <ImageReveal
                  src={selectedShow.artworkUrl}
                  alt=""
                  className="size-24 rounded-lg"
                />
              ) : null}
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-foreground-secondary block text-xs uppercase">
                    When
                  </span>
                  {formatDate(selectedShow.startAt)} at{' '}
                  {formatTimeRange(selectedShow.startAt, selectedShow.endAt)}
                </div>
                {selectedShow.location ? (
                  <div>
                    <span className="text-foreground-secondary block text-xs uppercase">
                      Location
                    </span>
                    {selectedShow.location}
                  </div>
                ) : null}
              </div>
              {selectedShow.description ? (
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  {selectedShow.description}
                </p>
              ) : (
                <p className="text-foreground-secondary text-sm">
                  Show details will appear here once the show has a description.
                </p>
              )}
            </div>
            <Dialog.Actions>
              {selectedShow.showId ? (
                <Link
                  to="/studio/shows/$id"
                  params={{ id: selectedShow.showId }}
                  onClick={() => setSelectedShow(null)}
                >
                  <Button variant="secondary">Open show</Button>
                </Link>
              ) : null}
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Actions>
          </>
        ) : null}
      </Dialog.Root>
    </section>
  );
}
