import { create } from 'zustand';

type State = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

/** Board page-comment mode in the right rail (shares mapNotesStore with atlas). */
export const usePageCommentsRailStore = create<State>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
  setOpen: (open) => set({ open }),
}));
