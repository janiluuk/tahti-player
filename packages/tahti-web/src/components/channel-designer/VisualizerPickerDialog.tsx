import { Badge, Button, Dialog } from '@tahti-player/ui';

import type { ColorScheme, VisualPreset } from '../../api/channel-design';
import { visualizerMetadata } from '../../plugins/visualizers';
import { ChannelVisualizer } from '../ChannelVisualizer';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  availableVisualizers: readonly Exclude<VisualPreset, 'MINIMAL'>[];
  selectedPreset: Exclude<VisualPreset, 'MINIMAL'>;
  onSelectPreset: (preset: Exclude<VisualPreset, 'MINIMAL'>) => void;
  onConfirm: () => void;
  livePreview: boolean;
  scheme: ColorScheme;
  visualSettingsJson: string;
  avatarUrl?: string | null;
  previewGradient: string;
};

export function VisualizerPickerDialog({
  isOpen,
  onClose,
  availableVisualizers,
  selectedPreset,
  onSelectPreset,
  onConfirm,
  livePreview,
  scheme,
  visualSettingsJson,
  avatarUrl,
  previewGradient,
}: Props) {
  if (!isOpen) {
    return null;
  }
  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-3xl">
      <Dialog.Title>Choose visualizer</Dialog.Title>
      <Dialog.Description>
        Preview each animated stage and choose the one that fits your channel.
      </Dialog.Description>
      <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {availableVisualizers.map((preset) => {
            const meta = visualizerMetadata(preset);
            const selected = selectedPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectPreset(preset)}
                className={`border-border flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-primary/50'
                }`}
              >
                <span className="bg-background-secondary relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  {livePreview ? (
                    <span className="absolute inset-0" aria-hidden>
                      <ChannelVisualizer
                        preset={preset}
                        colorScheme={scheme}
                        visualSettingsJson={visualSettingsJson}
                        className="size-full"
                        audioReactive={false}
                      />
                    </span>
                  ) : (
                    <span
                      className="absolute inset-0 animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${scheme.highlight ?? '#A78BFA'}, ${scheme.accent ?? '#22D3EE'}, ${scheme.bg ?? '#0B1220'})`,
                      }}
                    />
                  )}
                  <meta.Icon
                    size={16}
                    className="relative z-[1] text-white drop-shadow"
                    aria-hidden
                  />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">
                      {preset.replace(/_/g, ' ')}
                    </span>
                    {meta.audioReactive ? (
                      <Badge variant="pill" color="blue">
                        Audio reactive
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-foreground-secondary block truncate text-xs">
                    {meta.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="border-border bg-background relative min-h-56 overflow-hidden rounded-xl border"
          aria-label={`${selectedPreset.replace(/_/g, ' ')} preview`}
        >
          {livePreview ? (
            <ChannelVisualizer
              className="absolute inset-0 size-full"
              preset={selectedPreset}
              colorScheme={scheme}
              visualSettingsJson={visualSettingsJson}
              artworkUrl={avatarUrl}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: previewGradient }}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16 text-white">
            <div className="text-xs font-semibold tracking-wide uppercase">
              Live preview
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold">
              {selectedPreset.replace(/_/g, ' ')}
              {visualizerMetadata(selectedPreset).audioReactive ? (
                <Badge variant="pill" color="blue">
                  Audio reactive
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button onClick={onConfirm}>Use visualizer</Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
