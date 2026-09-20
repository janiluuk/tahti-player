import type { ReactNode } from 'react';
import { create } from 'zustand';

type RightRailOverride = {
  title: string;
  content: ReactNode;
};

type State = {
  override: RightRailOverride | null;
  setOverride: (next: RightRailOverride | null) => void;
};

/** Temporary right-rail takeover (channel designer tools) so chrome stays
 * docked and the main form/canvas is not covered by a floating overlay. */
export const useRightRailOverrideStore = create<State>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));
