import type { Meta, StoryObj } from '@storybook/react-vite';
import type { VisualSettingsMap } from '@tahti-web/api/channel-design';
import { TuningSliders } from '@tahti-web/components/channel-designer/TuningSliders';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

/** Speed / intensity sliders plus the audio-reactive switch, docked under
 * the visualizer picker on the Player → Visualizer tab. */
const meta: Meta<typeof TuningSliders> = {
  title: 'Tahti/Channel/Designer/TuningSliders',
  component: TuningSliders,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    preset: 'AURORA',
    visualSettings: {
      AURORA: { speed: 1.25, intensity: 0.8, audioReactive: true },
    },
    onSettingChange: fn(),
  },
  render: function Render(args) {
    const [settings, setSettings] = useState<VisualSettingsMap>(
      args.visualSettings,
    );
    return (
      <div className="flex max-w-sm flex-col gap-4">
        <TuningSliders
          preset={args.preset}
          visualSettings={settings}
          onSettingChange={(preset, key, value) => {
            setSettings((current) => ({
              ...current,
              [preset]: { ...current[preset], [key]: value },
            }));
            args.onSettingChange(preset, key, value);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TunedAurora: Story = {
  name: 'Aurora (tuned, audio reactive)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const speed = canvas.getByRole('slider', { name: 'Speed' });
    await expect(speed).toHaveValue('1.25');
    fireEvent.change(speed, { target: { value: '1.5' } });
    await expect(args.onSettingChange).toHaveBeenCalledWith(
      'AURORA',
      'speed',
      1.5,
    );
    fireEvent.change(canvas.getByRole('slider', { name: 'Intensity' }), {
      target: { value: '2' },
    });
    await expect(args.onSettingChange).toHaveBeenCalledWith(
      'AURORA',
      'intensity',
      2,
    );

    const reactive = canvas.getByRole('switch', { name: 'Audio reactive' });
    await expect(reactive).toBeChecked();
    await userEvent.click(reactive);
    await expect(reactive).not.toBeChecked();
    await expect(args.onSettingChange).toHaveBeenLastCalledWith(
      'AURORA',
      'audioReactive',
      false,
    );
  },
};

export const Defaults: Story = {
  name: 'Waveform bars (defaults)',
  args: { preset: 'WAVEFORM_BARS', visualSettings: {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('slider', { name: 'Speed' })).toHaveValue(
      '1',
    );
    await expect(
      canvas.getByRole('switch', { name: 'Audio reactive' }),
    ).toBeChecked();
  },
};
