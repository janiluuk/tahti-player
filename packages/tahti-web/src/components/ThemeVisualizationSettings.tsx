import { useTranslation } from '@tahti-player/i18n';
import { Button, SectionTitle, Slider, Toggle } from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
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
        <SectionTitle
          title={t('themeVisualization.backgroundVisualizations')}
          wrap
          className="font-display tracking-tight"
        />
        <p className="text-foreground-secondary mt-1 text-sm">
          {t('themeVisualization.someThemesCanShowA')}
        </p>
      </div>
      {!isThemeVisualizationEnabled(themeId) ? (
        <p className="text-foreground-secondary text-sm">
          {t('themeVisualization.backgroundVisualizationSettingsAreNot')}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {t('themeVisualization.showAnimatedBackground')}
              </p>
              <p className="text-foreground-secondary text-xs">
                {t('themeVisualization.turnItOffToUse')}
              </p>
            </div>
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              label={t('themeVisualization.showAnimatedBackground')}
            />
          </div>
          {enabled ? (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">
                  {t('themeVisualization.presets')}
                </p>
                <Button
                  size="sm"
                  variant={preset === 'AURORA' ? undefined : 'text'}
                  onClick={() => setPreset('AURORA')}
                >
                  Tahti Aurora
                </Button>
                <p className="text-foreground-secondary mt-1 text-xs">
                  {t('themeVisualization.softColourFieldsThatDrift')}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Slider
                  label={t('themeVisualization.opacity')}
                  min={0.05}
                  max={0.45}
                  step={0.01}
                  value={opacity}
                  showValue
                  onValueChange={setOpacity}
                />
                <p className="text-foreground-secondary -mt-2 text-xs">
                  {t('themeVisualization.howVisibleTheAmbienceIs')}
                </p>
                <Slider
                  label={t('themeVisualization.motionSpeed')}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={speed}
                  showValue
                  onValueChange={setSpeed}
                />
                <p className="text-foreground-secondary -mt-2 text-xs">
                  {t('themeVisualization.howQuicklyTheColorFields')}
                </p>
                <Slider
                  label={t('themeVisualization.intensity')}
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={intensity}
                  showValue
                  onValueChange={setIntensity}
                />
                <p className="text-foreground-secondary -mt-2 text-xs">
                  {t('themeVisualization.howStronglyPlaybackLevelsInfluence')}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {t('themeVisualization.audioReactivity')}
                  </p>
                  <p className="text-foreground-secondary text-xs">
                    {t('themeVisualization.letTheBackgroundRespondTo')}
                  </p>
                </div>
                <Toggle
                  checked={audioReactive}
                  onChange={setAudioReactive}
                  label={t('themeVisualization.audioReactivity')}
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
