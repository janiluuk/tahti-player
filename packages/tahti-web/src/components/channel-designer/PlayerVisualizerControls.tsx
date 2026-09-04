import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlaySquareIcon,
  SettingsIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge, Button, PluginItem, Tooltip } from '@tahti-player/ui';

import type { VisualPreset } from '../../api/channel-design';
import { visualizerMetadata } from '../../plugins/visualizers';
import { Eyebrow } from '../tahti/Eyebrow';

type Props = {
  activeVisualizer: Exclude<VisualPreset, 'MINIMAL'>;
  visualizerEnabled: boolean;
  showSettings: boolean;
  /** Tuning sliders when docked (owned by ChannelDesigner). */
  tuningSlot?: ReactNode;
  onOpenPicker: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleSettings: () => void;
  onToggleEnabled: () => void;
};

/** Player tab → Visualizer: preset chrome + optional tuning dock. */
export function PlayerVisualizerControls({
  activeVisualizer,
  visualizerEnabled,
  showSettings,
  tuningSlot,
  onOpenPicker,
  onPrevious,
  onNext,
  onToggleSettings,
  onToggleEnabled,
}: Props) {
  const meta = visualizerMetadata(activeVisualizer);
  const label = activeVisualizer.replace(/_/g, ' ');

  return (
    <section
      className="flex flex-col gap-4"
      data-testid="channel-player-visualizer"
    >
      <PluginItem
        icon={
          <button
            type="button"
            className="hover:bg-background-secondary flex size-full items-center justify-center rounded-lg transition-colors"
            aria-label="Choose visualizer"
            onClick={onOpenPicker}
          >
            <meta.Icon size={22} aria-hidden />
          </button>
        }
        name={
          <span className="inline-flex flex-wrap items-center gap-2 text-base">
            {label}
            {meta.audioReactive ? (
              <Badge variant="pill" color="blue">
                Audio reactive
              </Badge>
            ) : null}
          </span>
        }
        description={meta.description}
        descriptionBelow
        className={`ring-primary bg-primary/10 ring-2 ring-inset ${
          !visualizerEnabled ? 'opacity-50 grayscale' : ''
        }`}
        rightAccessory={
          <div className="flex items-center gap-1">
            <Tooltip content="Previous visualizer" side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={!visualizerEnabled}
                onClick={onPrevious}
                aria-label="Previous visualizer"
              >
                <ChevronLeftIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="Next visualizer" side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={!visualizerEnabled}
                onClick={onNext}
                aria-label="Next visualizer"
              >
                <ChevronRightIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={`Configure ${label}`} side="top">
              <Button
                size="icon-sm"
                variant={showSettings ? 'default' : 'text'}
                disabled={!visualizerEnabled}
                aria-pressed={showSettings}
                aria-label={`Configure ${label}`}
                onClick={onToggleSettings}
              >
                <SettingsIcon size={15} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip
              content={
                visualizerEnabled ? 'Disable visualizer' : 'Enable visualizer'
              }
              side="top"
            >
              <Button
                size="icon-sm"
                variant={visualizerEnabled ? 'default' : 'secondary'}
                aria-pressed={visualizerEnabled}
                aria-label={
                  visualizerEnabled ? 'Disable visualizer' : 'Enable visualizer'
                }
                onClick={onToggleEnabled}
              >
                {visualizerEnabled ? (
                  <CheckIcon size={15} aria-hidden />
                ) : (
                  <PlaySquareIcon size={15} aria-hidden />
                )}
              </Button>
            </Tooltip>
          </div>
        }
      />
      {tuningSlot ? (
        <div className="border-border flex flex-col gap-4 rounded-lg border p-3">
          <Eyebrow>Tune {label}</Eyebrow>
          {tuningSlot}
        </div>
      ) : null}
    </section>
  );
}
