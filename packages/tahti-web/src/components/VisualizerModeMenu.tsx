import { AudioWaveformIcon, CheckIcon } from 'lucide-react';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { Button, Popover } from '@tahti-player/ui';
import {
  ADVANCED_MODES,
  CYMATICS_MODES,
  type VisualizerMode,
} from '@tahti-player/visualizer';

import { visualizerModeLabel } from '../lib/visualizerModeLabel';
import { VisualizerModePreview } from './VisualizerModePreview';

type Props = {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  triggerClassName?: string;
  panelClassName?: string;
};

const GROUPS = [
  {
    id: 'analyzer',
    labelKey: 'visualizerModeMenuBatch36.analyzer',
    modes: ADVANCED_MODES,
  },
  {
    id: 'cymatics',
    labelKey: 'visualizerModeLabelBatch36.cymatics',
    modes: CYMATICS_MODES,
  },
] as const satisfies readonly {
  id: string;
  labelKey: ParseKeys<'web'>;
  modes: readonly VisualizerMode[];
}[];

export function VisualizerModeMenu({
  mode,
  onModeChange,
  triggerClassName,
  panelClassName,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <Popover
      anchor="bottom end"
      panelClassName={panelClassName}
      tooltip={{
        content: t('visualizerModeMenuText.visualizer'),
        side: 'left',
      }}
      trigger={
        <Button
          size="icon"
          variant="text"
          aria-label={t('visualizerModeMenuBatch36.current', {
            mode: visualizerModeLabel(t, mode),
          })}
          aria-haspopup="menu"
          data-testid="visualizer-mode-trigger"
          className={triggerClassName}
        >
          <AudioWaveformIcon size={22} aria-hidden />
        </Button>
      }
    >
      <Popover.Menu
        role="menu"
        aria-label={t('visualizerModeMenuText.visualizer')}
        data-testid="visualizer-mode-menu"
        className="max-h-[min(32rem,70dvh)] w-80 max-w-[calc(100vw-3rem)] gap-3 overflow-y-auto"
      >
        {GROUPS.map((group) => (
          <Popover.Section
            key={group.id}
            label={t(group.labelKey)}
            role="group"
            aria-label={t(group.labelKey)}
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
                    title={visualizerModeLabel(t, id)}
                    aria-label={visualizerModeLabel(t, id)}
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => onModeChange(id)}
                    className={`relative block rounded-lg border-2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${selected ? 'border-current' : 'border-transparent hover:border-current/50'}`}
                  >
                    <VisualizerModePreview mode={id} />
                    <span className="sr-only">
                      {visualizerModeLabel(t, id)}
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
