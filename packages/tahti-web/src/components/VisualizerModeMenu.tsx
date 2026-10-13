import { AudioWaveformIcon, CheckIcon } from 'lucide-react';

import { Button, Popover, Tooltip } from '@tahti-player/ui';
import {
  ADVANCED_MODES,
  CYMATICS_MODES,
  VISUALIZER_MODE_LABELS,
  type VisualizerMode,
} from '@tahti-player/visualizer';

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
      trigger={
        <Tooltip content="Visualizer" side="left">
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
        </Tooltip>
      }
    >
      <Popover.Menu
        role="menu"
        aria-label="Visualizer"
        data-testid="visualizer-mode-menu"
        className="min-w-56"
      >
        {GROUPS.map((group) => (
          <Popover.Section key={group.label} label={group.label} role="group">
            {group.modes.map((id) => {
              const selected = id === mode;
              return (
                <Popover.Item
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => onModeChange(id)}
                  icon={selected ? <CheckIcon size={16} aria-hidden /> : null}
                  className={selected ? 'font-semibold' : undefined}
                >
                  {VISUALIZER_MODE_LABELS[id]}
                </Popover.Item>
              );
            })}
          </Popover.Section>
        ))}
      </Popover.Menu>
    </Popover>
  );
}
