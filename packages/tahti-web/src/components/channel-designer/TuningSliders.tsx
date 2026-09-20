import { Slider, Toggle } from '@tahti-player/ui';

import {
  resolveVisualPresetSettings,
  type VisualSettingsMap,
} from '../../api/channel-design';
import { visualizerSupportsAudioReactive } from '../../plugins/visualizers';

type Props = {
  preset: string;
  visualSettings: VisualSettingsMap;
  onSettingChange: (
    preset: string,
    key: 'speed' | 'intensity' | 'audioReactive',
    value: number | boolean,
  ) => void;
};

export function TuningSliders({
  preset,
  visualSettings,
  onSettingChange,
}: Props) {
  return (
    <>
      {(['speed', 'intensity'] as const).map((key) => {
        const current = resolveVisualPresetSettings(visualSettings, preset);
        return (
          <Slider
            key={key}
            label={key === 'speed' ? 'Speed' : 'Intensity'}
            min={0.25}
            max={2}
            step={0.05}
            unit="×"
            value={current[key]}
            onValueChange={(value) => onSettingChange(preset, key, value)}
          />
        );
      })}
      {visualizerSupportsAudioReactive(preset) ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Audio reactive</span>
          <Toggle
            label="Audio reactive"
            checked={
              resolveVisualPresetSettings(visualSettings, preset).audioReactive
            }
            onChange={(checked) =>
              onSettingChange(preset, 'audioReactive', checked)
            }
          />
        </div>
      ) : null}
    </>
  );
}
