import { create } from 'zustand';

import type { AmbientTrackRowDensity } from '../components/AmbientTrackRow';

/** A row density, `list` (a plain data table) or `grid` (cover cards). */
export type TrackListView = AmbientTrackRowDensity | 'list' | 'grid';

const STORAGE_KEY = 'tahti.ambientTrackList.density';

const VIEWS: TrackListView[] = [
  'comfortable',
  'compact',
  'dense',
  'list',
  'grid',
];

function readStored(): TrackListView | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return VIEWS.includes(raw as TrackListView) ? (raw as TrackListView) : null;
  } catch {
    return null;
  }
}

type TrackListViewState = {
  /** The last view picked on any track listing; null until one is picked. */
  view: TrackListView | null;
  setView: (view: TrackListView) => void;
};

/**
 * One remembered listing view shared by every track list, so a picker in a
 * page's filter row (Studio Sounds) and the list it controls stay in sync.
 * Stored as the bare view id, the format older builds wrote.
 */
export const useTrackListViewStore = create<TrackListViewState>()((set) => ({
  view: readStored(),
  setView: (view) => {
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {
      /* private mode */
    }
    set({ view });
  },
}));
