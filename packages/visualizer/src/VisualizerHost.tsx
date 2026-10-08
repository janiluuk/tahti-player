import { lazy, Suspense, useId, useState, type ReactNode } from 'react';

import { getMasterGain } from '@tahti-player/audio-core';
import { CenteredLoader, cn, Select } from '@tahti-player/ui';

import {
  AdvancedVisualizer,
  type AdvancedMode,
} from './advanced/AdvancedVisualizer';
import {
  ALL_VISUALIZER_MODES,
  isCymaticsMode,
  VISUALIZER_MODE_LABELS,
  type CymaticsMode,
  type VisualizerMode,
} from './modes';

const LazyCymatics = lazy(() =>
  import('./cymatics/CymaticsVisualizer').then((m) => ({
    default: m.CymaticsVisualizer,
  })),
);

export type VisualizerHostProps = {
  mode?: VisualizerMode;
  onModeChange?: (mode: VisualizerMode) => void;
  className?: string;
  showModePicker?: boolean;
  suspended?: boolean;
  audioNode?: AudioNode | null;
  fallback?: ReactNode;
};

export function VisualizerHost({
  mode: modeProp,
  onModeChange,
  className,
  showModePicker = true,
  suspended,
  audioNode,
  fallback,
}: VisualizerHostProps) {
  const [modeState, setModeState] = useState<VisualizerMode>('spectrum');
  const mode = modeProp ?? modeState;
  const setMode = (m: VisualizerMode) => {
    setModeState(m);
    onModeChange?.(m);
  };
  const selectId = useId();
  const node = audioNode ?? getMasterGain();

  return (
    <div
      className={cn(
        'border-border bg-background-secondary/30 relative flex h-full min-h-48 flex-col overflow-hidden rounded-xl border',
        className,
      )}
    >
      {showModePicker ? (
        <div className="border-border flex items-end gap-3 border-b p-3">
          <div className="min-w-40 flex-1">
            <Select
              id={selectId}
              label="Mode"
              options={ALL_VISUALIZER_MODES.map((m) => ({
                id: m,
                label: VISUALIZER_MODE_LABELS[m],
              }))}
              value={mode}
              onValueChange={(next) => setMode(next as VisualizerMode)}
            />
          </div>
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {suspended ? (
          <div className="text-foreground-secondary flex h-full items-center justify-center text-sm">
            Suspended
          </div>
        ) : isCymaticsMode(mode) ? (
          <Suspense fallback={fallback ?? <CenteredLoader />}>
            <LazyCymatics
              mode={mode as CymaticsMode}
              audioNode={node}
              className="absolute inset-0 h-full w-full"
            />
          </Suspense>
        ) : (
          <AdvancedVisualizer
            mode={mode as AdvancedMode}
            onModeChange={(m) => setMode(m)}
            suspended={suspended}
            showModeButtons={!showModePicker}
          />
        )}
      </div>
    </div>
  );
}
