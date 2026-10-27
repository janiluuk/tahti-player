import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { KeyNotation } from '../lib/musicalKey';

export const BPM_TOLERANCES = [3, 6, 8] as const;
export type BpmTolerance = (typeof BPM_TOLERANCES)[number];

export const PREPARE_PLAYLIST_NAME = 'Prepare';

type DjPrefsState = {
  keyNotation: KeyNotation;
  setKeyNotation: (value: KeyNotation) => void;
  bpmTolerance: BpmTolerance;
  setBpmTolerance: (value: BpmTolerance) => void;
  halfDouble: boolean;
  setHalfDouble: (value: boolean) => void;
};

export const useDjPrefsStore = create<DjPrefsState>()(
  persist(
    (set) => ({
      keyNotation: 'musical',
      setKeyNotation: (keyNotation) => set({ keyNotation }),
      bpmTolerance: 6,
      setBpmTolerance: (bpmTolerance) => set({ bpmTolerance }),
      halfDouble: true,
      setHalfDouble: (halfDouble) => set({ halfDouble }),
    }),
    { name: 'tahti-dj-prefs' },
  ),
);
