import { Toggle } from '@tahti-player/ui';

import {
  BACKGROUND_VISUAL_PRESETS,
  type ColorScheme,
} from '../../api/channel-design';
import { visualizerMetadata } from '../../plugins/visualizers';
import { Eyebrow } from '../tahti/Eyebrow';
import { ColorSchemeFields } from './ColorSchemeFields';

type Props = {
  useBackgroundGradient: boolean;
  onUseBackgroundGradient: (enabled: boolean) => void;
  backgroundScheme: ColorScheme;
  onBackgroundSchemeChange: (next: ColorScheme) => void;
  backgroundVisualPreset: string | null | undefined;
  onBackgroundVisualPreset: (preset: string) => void;
};

/** Separate page palette toggle + ambient background visualizer picker. */
export function BackdropBackgroundExtras({
  useBackgroundGradient,
  onUseBackgroundGradient,
  backgroundScheme,
  onBackgroundSchemeChange,
  backgroundVisualPreset,
  onBackgroundVisualPreset,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      <label className="border-border bg-background-secondary/40 flex items-start gap-3 rounded-lg border p-3 text-sm">
        <Toggle
          checked={useBackgroundGradient}
          onChange={onUseBackgroundGradient}
          label="Use a separate background palette"
          className="mt-0.5"
        />
        <span>
          <span className="block font-semibold">
            Full separate background palette
          </span>
          <span className="text-foreground-secondary block text-xs">
            Optional — edit every background color independently of header
            accents. The Background swatch above always works.
          </span>
        </span>
      </label>
      {useBackgroundGradient ? (
        <ColorSchemeFields
          scheme={backgroundScheme}
          onChange={onBackgroundSchemeChange}
          variant="generic"
        />
      ) : (
        <p className="text-foreground-secondary text-xs">
          The page currently matches the header colors. Turn on a separate
          palette to style the background on its own.
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Eyebrow>Background visualizer</Eyebrow>
        <p className="text-foreground-secondary text-xs">
          Ambient WebGL behind the artist and channel pages — separate from the
          header/player visualizer.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BACKGROUND_VISUAL_PRESETS.map((preset) => {
            const meta = visualizerMetadata(preset);
            const Icon = meta.Icon;
            const selected =
              (backgroundVisualPreset ?? 'INTERACTIVE_POINTS') === preset;
            return (
              <button
                key={preset}
                type="button"
                title={meta.description}
                aria-label={`${preset.replace(/_/g, ' ')} background visualizer`}
                aria-pressed={selected}
                onClick={() => onBackgroundVisualPreset(preset)}
                className={`border-border flex flex-col items-start gap-1 rounded-md border p-2 text-left text-xs transition-transform hover:scale-[1.02] ${
                  selected
                    ? 'border-primary bg-primary/10 ring-primary ring-1'
                    : 'bg-background-secondary/40'
                }`}
              >
                <Icon size={16} aria-hidden className="opacity-80" />
                <span className="font-semibold tracking-wide uppercase">
                  {preset.replace(/_/g, ' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
