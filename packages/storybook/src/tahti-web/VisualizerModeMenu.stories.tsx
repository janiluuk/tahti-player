import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisualizerModeMenu } from '@tahti-web/components/VisualizerModeMenu';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import type { VisualizerMode } from '@tahti-player/visualizer';

const meta: Meta<typeof VisualizerModeMenu> = {
  title: 'Tahti/Player/VisualizerModeMenu',
  component: VisualizerModeMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Popup menu for choosing the visualizer behind the full-screen player. The visualizer there is a backdrop under the player content, so its own mode controls cannot be clicked; this button lives in the top bar instead.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial }: { initial: VisualizerMode }) {
  const [mode, setMode] = useState<VisualizerMode>(initial);
  return (
    <div className="flex min-h-96 justify-end">
      <VisualizerModeMenu mode={mode} onModeChange={setMode} />
    </div>
  );
}

export const Closed: Story = {
  render: () => <Demo initial="spectrum" />,
};

export const PickAMode: Story = {
  render: () => <Demo initial="spectrum" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByTestId('visualizer-mode-trigger'));
    const menu = await body.findByTestId('visualizer-mode-menu');
    await expect(
      within(menu).getByRole('menuitemradio', { name: 'Spectrum' }),
    ).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(
      within(menu).getByRole('menuitemradio', { name: 'Cymatics' }),
    );
    await expect(
      within(menu).getByRole('menuitemradio', { name: 'Cymatics' }),
    ).toHaveAttribute('aria-checked', 'true');
  },
};
