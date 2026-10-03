import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  VISUAL_PRESETS,
  type VisualPreset,
} from '@tahti-web/api/channel-design';
import { VisualizerPickerDialog } from '@tahti-web/components/channel-designer/VisualizerPickerDialog';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { DESIGN_SCHEME } from './_fixtures/channel-design';
import { expectNoDialog, findDialog } from './_lib/play';

type Picked = Exclude<VisualPreset, 'MINIMAL'>;

const AVAILABLE = VISUAL_PRESETS.filter(
  (preset): preset is Picked => preset !== 'MINIMAL',
);

function PickerDemo(args: ComponentProps<typeof VisualizerPickerDialog>) {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const [selected, setSelected] = useState<Picked>(args.selectedPreset);
  return (
    <VisualizerPickerDialog
      {...args}
      isOpen={isOpen}
      selectedPreset={selected}
      onSelectPreset={(preset) => {
        setSelected(preset);
        args.onSelectPreset(preset);
      }}
      onClose={() => {
        setIsOpen(false);
        args.onClose();
      }}
      onConfirm={() => {
        args.onConfirm();
        setIsOpen(false);
      }}
    />
  );
}

/** Player → Visualizer "Choose visualizer" dialog. `livePreview: false`
 * swaps the WebGL tiles for gradient placeholders (the Settings modal case);
 * the LivePreview story mounts the real visualizers. */
const meta: Meta<typeof VisualizerPickerDialog> = {
  title: 'Tahti/Channel/Designer/VisualizerPickerDialog',
  component: VisualizerPickerDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    availableVisualizers: AVAILABLE,
    selectedPreset: 'AURORA',
    livePreview: false,
    scheme: DESIGN_SCHEME,
    visualSettingsJson: JSON.stringify({ AURORA: { speed: 1.25 } }),
    avatarUrl: 'https://picsum.photos/seed/tahti-northern-lights/256',
    previewGradient: 'linear-gradient(135deg,#A78BFA,#22D3EE,#0B1220)',
    onClose: fn(),
    onSelectPreset: fn(),
    onConfirm: fn(),
  },
  render: (args) => <PickerDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PickAndConfirm: Story = {
  name: 'Pick a visualizer and confirm',
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Choose visualizer');
    await expect(dialog.getByLabelText('AURORA preview')).toBeVisible();
    await userEvent.click(
      dialog.getByRole('button', { name: /WAVEFORM BARS/ }),
    );
    await expect(args.onSelectPreset).toHaveBeenCalledWith('WAVEFORM_BARS');
    await expect(
      dialog.getByRole('button', { name: /WAVEFORM BARS/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByLabelText('WAVEFORM BARS preview')).toBeVisible();
    await userEvent.click(
      dialog.getByRole('button', { name: 'Use visualizer' }),
    );
    await expect(args.onConfirm).toHaveBeenCalledOnce();
    await expectNoDialog(canvasElement);
  },
};

export const Cancel: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Choose visualizer');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const LivePreview: Story = {
  name: 'Live WebGL preview',
  args: { livePreview: true, selectedPreset: 'PARTICLE_FIELD' },
};
