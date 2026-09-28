import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The right rail shows the queue and nothing else. Chat and notifications
 * live in the top bar (user decision 2026-09-28, docs/DECISIONS.md); keep
 * this a single value so they can't come back as rail views.
 */
export type RightRailTab = 'queue';

type LayoutState = {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  leftWidth: number;
  rightWidth: number;
  /** Expand past | play | upcoming strip in the bottom player. */
  bottomQueueOpen: boolean;
  /** Shared with player-bar queue button and RightRailPanel. */
  rightRailTab: RightRailTab;
  /** Full-screen now-playing overlay -- deliberately not persisted, a
   * reload should never drop the user straight into it. */
  fullScreenPlayerOpen: boolean;

  toggleLeft: () => void;
  setLeftCollapsed: (collapsed: boolean) => void;
  toggleRight: () => void;
  setLeftWidth: (n: number) => void;
  setRightWidth: (n: number) => void;
  setRightCollapsed: (collapsed: boolean) => void;
  setBottomQueueOpen: (open: boolean) => void;
  toggleBottomQueue: () => void;
  setRightRailTab: (tab: RightRailTab) => void;
  /** Queue button: opens the rail, or collapses it when open. */
  toggleQueueRail: () => void;
  setFullScreenPlayerOpen: (open: boolean) => void;
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftCollapsed: false,
      rightCollapsed: false,
      leftWidth: 220,
      rightWidth: 340,
      bottomQueueOpen: false,
      rightRailTab: 'queue',
      fullScreenPlayerOpen: false,

      toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
      setLeftCollapsed: (leftCollapsed) => set({ leftCollapsed }),
      toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
      setLeftWidth: (leftWidth) => set({ leftWidth }),
      setRightWidth: (rightWidth) => set({ rightWidth }),
      setRightCollapsed: (rightCollapsed) => set({ rightCollapsed }),
      setBottomQueueOpen: (bottomQueueOpen) => set({ bottomQueueOpen }),
      toggleBottomQueue: () =>
        set((s) => ({ bottomQueueOpen: !s.bottomQueueOpen })),
      setRightRailTab: (rightRailTab) => set({ rightRailTab }),
      toggleQueueRail: () =>
        set((s) => ({ rightCollapsed: !s.rightCollapsed })),
      setFullScreenPlayerOpen: (fullScreenPlayerOpen) =>
        set({ fullScreenPlayerOpen }),
    }),
    {
      name: 'tahti-web-layout',
      version: 7,
      migrate: (persisted) => {
        const p = { ...((persisted ?? {}) as Record<string, unknown>) };
        delete p.rightRailMode;
        // v7: the rail is the queue only; chat state is gone.
        return {
          leftCollapsed:
            typeof p.leftCollapsed === 'boolean' ? p.leftCollapsed : false,
          rightCollapsed:
            typeof p.rightCollapsed === 'boolean' ? p.rightCollapsed : false,
          bottomQueueOpen:
            typeof p.bottomQueueOpen === 'boolean' ? p.bottomQueueOpen : false,
          rightRailTab: 'queue' as const,
          rightWidth: typeof p.rightWidth === 'number' ? p.rightWidth : 340,
          leftWidth: typeof p.leftWidth === 'number' ? p.leftWidth : 220,
        };
      },
      partialize: (s) => ({
        leftCollapsed: s.leftCollapsed,
        rightCollapsed: s.rightCollapsed,
        bottomQueueOpen: s.bottomQueueOpen,
        rightRailTab: s.rightRailTab,
        rightWidth: s.rightWidth,
        leftWidth: s.leftWidth,
      }),
    },
  ),
);
