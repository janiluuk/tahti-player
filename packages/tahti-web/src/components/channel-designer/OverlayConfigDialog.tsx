import { Dialog, Slider } from '@tahti-player/ui';

import type { NowPlayingOverlaySettings } from '../../content/nowPlayingOverlayPresets';

type Props = {
  isOpen: boolean;
  overlaySettings: NowPlayingOverlaySettings;
  onClose: () => void;
  onSettingChange: <SettingKey extends keyof NowPlayingOverlaySettings>(
    key: SettingKey,
    value: NowPlayingOverlaySettings[SettingKey],
  ) => void;
};

export function OverlayConfigDialog({
  isOpen,
  overlaySettings,
  onClose,
  onSettingChange,
}: Props) {
  if (!isOpen) {
    return null;
  }
  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <Dialog.Title>Configure text overlay</Dialog.Title>
      <Dialog.Description>
        Fine-tune the now-playing title and artist overlay used on your channel.
      </Dialog.Description>
      <div className="flex flex-col gap-4">
        <Slider
          label={`Text size: ${Math.round(overlaySettings.textScale * 100)}%`}
          min={0.6}
          max={1.6}
          step={0.05}
          value={overlaySettings.textScale}
          onValueChange={(value) => onSettingChange('textScale', value)}
        />
        <Slider
          label={`Horizontal position: ${overlaySettings.offsetX}px`}
          min={-120}
          max={120}
          step={4}
          value={overlaySettings.offsetX}
          onValueChange={(value) => onSettingChange('offsetX', value)}
        />
        <Slider
          label={`Vertical position: ${overlaySettings.offsetY}px`}
          min={-120}
          max={120}
          step={4}
          value={overlaySettings.offsetY}
          onValueChange={(value) => onSettingChange('offsetY', value)}
        />
        <Slider
          label={`Opacity: ${Math.round(overlaySettings.opacity * 100)}%`}
          min={0.2}
          max={1}
          step={0.05}
          value={overlaySettings.opacity}
          onValueChange={(value) => onSettingChange('opacity', value)}
        />
      </div>
    </Dialog.Root>
  );
}
