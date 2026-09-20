import { createContext, useContext } from 'react';

import { Track } from '@tahti-player/model';

import { TrackTableActions, TrackTableLabels, TrackTableProps } from './types';

export type TrackTableContextValue<T extends Track> = {
  isReorderable: boolean;
  features: NonNullable<TrackTableProps['features']>;
  actions: TrackTableActions<T>;
  labels: TrackTableLabels;
  /** Same stable-id function passed to `TrackTable` -- cells need it to
   * key selection/reorder state by item identity, not row position, since
   * sorting/filtering changes a row's index without changing its data. */
  getItemId: (track: T, index: number) => string;
};

// any is unavoidable here due to the generics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TrackTableContext = createContext<TrackTableContextValue<any> | null>(
  null,
);

export function TrackTableProvider<T extends Track>({
  value,
  children,
}: {
  value: TrackTableContextValue<T>;
  children: React.ReactNode;
}) {
  return (
    <TrackTableContext.Provider value={value}>
      {children}
    </TrackTableContext.Provider>
  );
}

export function useTrackTableContext<T extends Track>() {
  const ctx = useContext(TrackTableContext);
  if (!ctx) {
    throw new Error(
      'useTrackTableContext must be used within <TrackTableProvider>',
    );
  }
  return ctx as TrackTableContextValue<T>;
}
