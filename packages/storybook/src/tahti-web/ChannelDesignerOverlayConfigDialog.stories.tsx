import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverlayConfigDialog } from '@tahti-web/components/channel-designer/OverlayConfigDialog';
import {
  DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
  type NowPlayingOverlaySettings,
} from '@tahti-web/content/nowPlayingOverlayPresets';
import { useState, type ComponentProps } from 'react';
import { expect, fireEvent, fn, userEvent } from 'storybook/test';

import { expectNoDialog, findDialog } from './_lib/play';

function OverlayConfigDemo(args: ComponentProps<typeof OverlayConfigDialog>) {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const [settings, setSettings] = useState<NowPlayingOverlaySettings>(
    args.overlaySettings,
  );
  return (
    <OverlayConfigDialog
      isOpen={isOpen}
      overlaySettings={settings}
      onClose={() => {
        setIsOpen(false);
        args.onClose();
      }}
      onSettingChange={(key, value) => {
        setSettings((current) => ({ ...current, [key]: value }));
        args.onSettingChange(key, value);
      }}
    />
  );
}

/** Player → Overlay "Configure text" dialog: size, offset and opacity of
 * the now-playing title/artist overlay. */
const meta: Meta<typeof OverlayConfigDialog> = {
  title: 'Tahti/Channel/Designer/OverlayConfigDialog',
  component: OverlayConfigDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    overlaySettings: {
      textScale: 1.2,
      offsetX: -16,
      offsetY: 24,
      opacity: 0.85,
    },
    onClose: fn(),
    onSettingChange: fn(),
  },
  render: (args) => <OverlayConfigDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tuned: Story = {
  name: 'Tuned overlay',
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Configure text overlay');
    await expect(
      dialog.getByRole('slider', { name: 'Text size: 120%' }),
    ).toHaveValue('1.2');
    fireEvent.change(dialog.getByRole('slider', { name: /Opacity/ }), {
      target: { value: '0.5' },
    });
    await expect(args.onSettingChange).toHaveBeenCalledWith('opacity', 0.5);
    await expect(
      dialog.getByRole('slider', { name: 'Opacity: 50%' }),
    ).toHaveValue('0.5');
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalled();
    await expectNoDialog(canvasElement);
  },
};

export const Defaults: Story = {
  args: { overlaySettings: DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Configure text overlay');
    await expect(
      dialog.getByRole('slider', { name: 'Horizontal position: 0px' }),
    ).toHaveValue('0');
  },
};
