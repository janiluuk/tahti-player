import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelVizPackPicker } from '@tahti-web/components/channel-designer/ChannelVizPackPicker';
import { ChannelVizPackLabel } from '@tahti-web/components/channel-view/ChannelVizPackLabel';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

/**
 * Player → Visualizer → Show pack. The pack is saved in the channel's
 * `visualSettings` map under a `pack:<id>` key; the listener label below
 * reads the same value.
 */
const meta: Meta<typeof ChannelVizPackPicker> = {
  title: 'Tahti/Channel/Designer/ChannelVizPackPicker',
  component: ChannelVizPackPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  initial = null,
  disabled = false,
}: {
  initial?: string | null;
  disabled?: boolean;
}) {
  const [packId, setPackId] = useState<string | null>(initial);
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <ChannelVizPackPicker
        value={packId}
        onChange={setPackId}
        disabled={disabled}
      />
      <div className="flex min-h-6 items-center">
        <ChannelVizPackLabel
          channel={{
            headerStyle: 'VIDEO_LOOP',
            visualSettingsJson: packId
              ? JSON.stringify({ [`pack:${packId}`]: {} })
              : null,
          }}
        />
      </div>
    </div>
  );
}

export const NoPack: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('channel-viz-pack-label')).toBeNull();
    await userEvent.click(canvas.getByRole('radio', { name: /Club night/ }));
    await expect(
      canvas.getByTestId('channel-viz-pack-label'),
    ).toHaveTextContent('This show uses Club night');
  },
};

export const PackSelected: Story = {
  render: () => <Demo initial="deep-listening" />,
};

export const VisualizerOff: Story = {
  render: () => <Demo initial="signal-lab" disabled />,
};
