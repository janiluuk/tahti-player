import { AudioWaveformIcon, CheckIcon } from 'lucide-react';

import { Button, Popover } from '@tahti-player/ui';
import {
  ADVANCED_MODES,
  CYMATICS_MODES,
  VISUALIZER_MODE_LABELS,
  type VisualizerMode,
} from '@tahti-player/visualizer';

import { VisualizerModePreview } from './VisualizerModePreview';

type Props = {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  triggerClassName?: string;
  panelClassName?: string;
};

const GROUPS: readonly {
  label: string;
  modes: readonly VisualizerMode[];
}[] = [
  { label: 'Analyzer', modes: ADVANCED_MODES },
  { label: 'Cymatics', modes: CYMATICS_MODES },
];

export function VisualizerModeMenu({
  mode,
  onModeChange,
  triggerClassName,
  panelClassName,
}: Props) {
  return (
    <Popover
      anchor="bottom end"
      panelClassName={panelClassName}
      tooltip={{ content: 'Visualizer', side: 'left' }}
      trigger={
        <Button
          size="icon"
          variant="text"
          aria-label={`Visualizer: ${VISUALIZER_MODE_LABELS[mode]}`}
          aria-haspopup="menu"
          data-testid="visualizer-mode-trigger"
          className={triggerClassName}
        >
          <AudioWaveformIcon size={24} aria-hidden />
        </Button>
      }
    >
      <Popover.Menu
        role="menu"
        aria-label="Visualizer"
        data-testid="visualizer-mode-menu"
        className="max-h-[min(32rem,70dvh)] w-80 max-w-[calc(100vw-3rem)] gap-3 overflow-y-auto"
      >
        {GROUPS.map((group) => (
          <Popover.Section
            key={group.label}
            label={group.label}
            role="group"
            aria-label={group.label}
          >
            <div className="grid grid-cols-2 gap-2 p-1">
              {group.modes.map((id) => {
                const selected = id === mode;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="plain"
                    size="flexible"
                    title={VISUALIZER_MODE_LABELS[id]}
                    aria-label={VISUALIZER_MODE_LABELS[id]}
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => onModeChange(id)}
                    className={`relative block rounded-lg border-2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${selected ? 'border-current' : 'border-transparent hover:border-current/50'}`}
                  >
                    <VisualizerModePreview mode={id} />
                    <span className="sr-only">
                      {VISUALIZER_MODE_LABELS[id]}
                    </span>
                    {selected && (
                      <span className="bg-background text-foreground absolute top-2 right-2 rounded-full p-1">
                        <CheckIcon size={14} aria-hidden />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </Popover.Section>
        ))}
      </Popover.Menu>
    </Popover>
  );
}
