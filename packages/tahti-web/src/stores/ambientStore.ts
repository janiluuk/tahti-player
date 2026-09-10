import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { VisualPreset } from '../api/channel-design';

export const AMBIENT_PRESETS = [
  'AURORA',
  'PARTICLE_FIELD',
  'REACTIVE_GRID',
] as const satisfies readonly VisualPreset[];

export type AmbientPreset = (typeof AMBIENT_PRESETS)[number];

type AmbientState = {
  enabled: boolean;
  preset: AmbientPreset;
  opacity: number;
  speed: number;
  intensity: number;
  audioReactive: boolean;
  setEnabled: (enabled: boolean) => void;
  setPreset: (preset: AmbientPreset) => void;
  setOpacity: (opacity: number) => void;
  setSpeed: (speed: number) => void;
  setIntensity: (intensity: number) => void;
  setAudioReactive: (audioReactive: boolean) => void;
};

export const useAmbientStore = create<AmbientState>()(
  persist(
    (set) => ({
      enabled: true,
      preset: 'AURORA',
      opacity: 0.28,
      speed: 0.16,
      intensity: 0.7,
      audioReactive: true,
      setEnabled: (enabled) => set({ enabled }),
      setPreset: (preset) => set({ preset }),
      setOpacity: (opacity) => set({ opacity }),
      setSpeed: (speed) => set({ speed }),
      setIntensity: (intensity) => set({ intensity }),
      setAudioReactive: (audioReactive) => set({ audioReactive }),
    }),
    { name: 'tahti-nuclear-ambient-background' },
  ),
);
