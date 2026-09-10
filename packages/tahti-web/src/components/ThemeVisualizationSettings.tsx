import { Button, Slider, Toggle } from '@tahti-player/ui';

import { useThemeStore } from '../plugins/themes';
import { TAHTI_BLUE_THEME_ID } from '../plugins/themes/presets';
import { useAmbientStore } from '../stores/ambientStore';

const TAHTI_THEME_ID = 'nuclear:tahti-dark';
const VISUALIZATION_THEME_IDS = new Set([
  TAHTI_THEME_ID,
  TAHTI_BLUE_THEME_ID,
  'nuclear:default',
]);

export function isThemeVisualizationEnabled(themeId: string): boolean {
  return VISUALIZATION_THEME_IDS.has(themeId);
}

/** Background visualization controls for Tahti themes.
 * Pass `themeId` when configuring a theme that may not be the active one
 * (Settings dialog / Add-ons expand) — otherwise the active store theme is used. */
export function ThemeVisualizationSettings({
  themeId: themeIdProp,
}: {
  themeId?: string;
} = {}) {
  const activeThemeId = useThemeStore((state) => state.themeId);
  const themeId = themeIdProp ?? activeThemeId;
  const enabled = useAmbientStore((state) => state.enabled);
  const preset = useAmbientStore((state) => state.preset);
  const opacity = useAmbientStore((state) => state.opacity);
  const speed = useAmbientStore((state) => state.speed);
  const intensity = useAmbientStore((state) => state.intensity);
  const audioReactive = useAmbientStore((state) => state.audioReactive);
  const setEnabled = useAmbientStore((state) => state.setEnabled);
  const setPreset = useAmbientStore((state) => state.setPreset);
  const setOpacity = useAmbientStore((state) => state.setOpacity);
  const setSpeed = useAmbientStore((state) => state.setSpeed);
  const setIntensity = useAmbientStore((state) => state.setIntensity);
  const setAudioReactive = useAmbientStore((state) => state.setAudioReactive);

  return (
    <section className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Background visualizations
        </h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          Tahti themes (and the stock Nuclear default) can show a quiet,
          audio-reactive Three.js ambience behind the app.
        </p>
      </div>
      {!isThemeVisualizationEnabled(themeId) ? (
        <p className="text-foreground-secondary text-sm">
          Background visualization settings are not available for this theme
          yet.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Show animated background</p>
              <p className="text-foreground-secondary text-xs">
                Turn it off to use a still background or reduce GPU use.
              </p>
            </div>
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              label="Show animated background"
            />
          </div>
          {enabled ? (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">Presets</p>
                <Button
                  size="sm"
                  variant={preset === 'AURORA' ? undefined : 'text'}
                  onClick={() => setPreset('AURORA')}
                >
                  Tahti Aurora
                </Button>
                <p className="text-foreground-secondary mt-1 text-xs">
                  The first preset ported from the Tahti frontend; it blends
                  soft color fields and playback movement.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Slider
                  label="Opacity"
                  min={0.05}
                  max={0.45}
                  step={0.01}
                  value={opacity}
                  showValue
                  onValueChange={setOpacity}
                />
                <p className="text-foreground-secondary -mt-2 text-xs">
                  How visible the ambience is over the theme.
                </p>
                <Slider
                  label="Motion speed"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={speed}
                  showValue
                  onValueChange={setSpeed}
                />
                <p className="text-foreground-secondary -mt-2 text-xs">
                  How quickly the color fields evolve.
                </p>
                <Slider
                  label="Intensity"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={intensity}
                  showValue
                  onValueChange={setIntensity}
                />
                <p className="text-foreground-secondary -mt-2 text-xs">
                  How strongly playback levels influence the animation.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Audio reactivity</p>
                  <p className="text-foreground-secondary text-xs">
                    Let the background respond to the current player level.
                  </p>
                </div>
                <Toggle
                  checked={audioReactive}
                  onChange={setAudioReactive}
                  label="Audio reactivity"
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
