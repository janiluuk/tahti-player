import { useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Card, CardGrid, cn } from '@tahti-player/ui';

import { usePhoneViewport } from '../hooks/usePhoneViewport';
import { resolveTrackListView } from '../lib/trackListViewResolve';
import {
  useTrackListViewStore,
  type TrackListView,
} from '../stores/trackListViewStore';
import {
  AmbientTrackRow,
  type AmbientTrackRowDensity,
  type AmbientTrackRowProps,
} from './AmbientTrackRow';
import { PageEmpty } from './PageStates';
import { trackViewOptions, TrackViewPicker } from './TrackViewPicker';

/** A row density, `list` (a plain data table) or `grid` (cover cards). */
export type AmbientTrackListView = TrackListView;

export type AmbientTrackListItem = Omit<
  AmbientTrackRowProps,
  'density' | 'className'
> & {
  id: string;
};

export type AmbientTrackListProps = {
  items: AmbientTrackListItem[];
  /** Controlled density — omit to self-manage (+ persist). */
  density?: AmbientTrackRowDensity;
  defaultDensity?: AmbientTrackRowDensity;
  onDensityChange?: (density: AmbientTrackRowDensity) => void;
  /** Share the remembered view with other track lists (default true when
   * uncontrolled). */
  persistDensity?: boolean;
  emptyMessage?: string;
  /** What the header counts, e.g. `sound` reads "3 sounds". */
  itemNoun?: 'track' | 'sound';
  /** Leads the toolbar row, e.g. a filter box. With it the toolbar stays
   * up when `items` is empty, so the filter can be cleared. */
  toolbarStart?: ReactNode;
  /** Extra controls before the size picker, e.g. a sort dropdown. */
  toolbarEnd?: ReactNode;
  /** The page renders the size picker elsewhere (bound to the same store). */
  hideViewPicker?: boolean;
  /** Offers a List option in the switcher; renders this in place of the rows. */
  renderList?: () => ReactNode;
  /** Offers a Grid option: cover cards with play, no waveform. */
  allowGrid?: boolean;
  /** Starting view for this list only (not shared with other lists). */
  initialView?: AmbientTrackListView;
  /** Section title in place of the track count, with no panel around the
   * list, so it lines up with the `CardsRow` sections beside it. */
  heading?: ReactNode;
  className?: string;
};

export function AmbientTrackList({
  items,
  density: densityProp,
  defaultDensity = 'comfortable',
  onDensityChange,
  persistDensity,
  emptyMessage = 'No tracks yet.',
  itemNoun = 'track',
  toolbarStart,
  toolbarEnd,
  hideViewPicker = false,
  renderList,
  allowGrid = false,
  initialView,
  heading,
  className,
}: AmbientTrackListProps) {
  const { t } = useTranslation('web');
  const controlled = densityProp !== undefined;
  // A list with its own starting view keeps its own choice instead of the
  // view shared by every other list.
  const shouldPersist = initialView ? false : (persistDensity ?? !controlled);
  const storedView = useTrackListViewStore((state) => state.view);
  const storeView = useTrackListViewStore((state) => state.setView);
  const [picked, setPicked] = useState<AmbientTrackListView | null>(null);
  const isPhone = usePhoneViewport();
  const view: AmbientTrackListView = resolveTrackListView({
    controlledView: controlled ? densityProp : undefined,
    persist: shouldPersist,
    storedView,
    pickedView: picked,
    initialView,
    defaultDensity,
    isPhone,
    hasList: Boolean(renderList),
  });
  const showList = view === 'list' && Boolean(renderList);
  const showGrid = view === 'grid' && allowGrid;
  const density: AmbientTrackRowDensity =
    view === 'list' || view === 'grid' ? defaultDensity : view;
  const activeView: AmbientTrackListView = showList
    ? 'list'
    : showGrid
      ? 'grid'
      : density;
  const options = trackViewOptions({
    allowGrid,
    allowList: Boolean(renderList),
  });

  const setView = (next: AmbientTrackListView) => {
    if (!controlled) {
      if (shouldPersist) {
        storeView(next);
      } else {
        setPicked(next);
      }
    }
    if (next !== 'list' && next !== 'grid') {
      onDensityChange?.(next);
    }
  };

  if (items.length === 0 && !toolbarStart) {
    return (
      <PageEmpty
        title={emptyMessage}
        className={className}
        data-testid="ambient-track-list"
      />
    );
  }

  return (
    <section
      className={cn(
        'flex w-full min-w-0 flex-col',
        heading
          ? 'gap-3'
          : 'border-border/40 bg-background-secondary/40 gap-2 rounded-[var(--radius-card)] border p-2 sm:p-3',
        className,
      )}
      data-testid="ambient-track-list"
      data-density={activeView}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          heading ? 'min-h-10' : 'px-1',
          toolbarStart ? 'flex-nowrap' : 'flex-wrap',
        )}
        data-testid="ambient-track-list-toolbar"
      >
        {toolbarStart ? (
          <div className="min-w-0 flex-1">{toolbarStart}</div>
        ) : null}
        {/* The list view is a table that prints its own count. */}
        {heading ? (
          <h2 className="text-foreground me-auto text-lg font-bold">
            {heading}
          </h2>
        ) : showList ? null : (
          <span
            className={cn(
              'text-foreground-secondary shrink-0 text-xs font-semibold tabular-nums',
              toolbarStart ? 'hidden sm:inline' : 'me-auto',
            )}
            data-testid="ambient-track-list-count"
          >
            {t(
              itemNoun === 'sound'
                ? 'ambientTrackList.soundCount'
                : 'ambientTrackList.trackCount',
              { count: items.length },
            )}
          </span>
        )}
        {toolbarEnd || !hideViewPicker ? (
          <div
            className="ms-auto flex shrink-0 items-center gap-2"
            data-testid="ambient-track-list-sort-size"
          >
            {toolbarEnd}
            {hideViewPicker ? null : (
              <TrackViewPicker
                options={options}
                value={activeView}
                onChange={setView}
              />
            )}
          </div>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-foreground-secondary px-1 py-6 text-center text-sm">
          {emptyMessage}
        </p>
      ) : null}
      {items.length === 0 ? null : showList && renderList ? (
        renderList()
      ) : showGrid ? (
        <CardGrid data-testid="ambient-track-grid">
          {items.map((item) => (
            <Card
              key={item.id}
              src={item.coverUrl ?? undefined}
              title={item.titleNode ?? item.title}
              subtitle={item.artist}
              surface="neutral"
              onPlay={item.onPlay}
              isPlaying={item.isPlaying}
              playLabel={`Play ${item.title}`}
              pauseLabel={`Pause ${item.title}`}
            />
          ))}
        </CardGrid>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const { id, ...row } = item;
            return (
              <li key={id} className="min-w-0 list-none">
                <AmbientTrackRow {...row} density={density} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
