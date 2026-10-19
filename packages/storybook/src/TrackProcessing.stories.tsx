import { StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { TrackProcessing } from '@tahti-player/ui';

const meta = {
  title: 'Components/TrackProcessing',
  component: TrackProcessing,
  parameters: {
    docs: {
      description: {
        component:
          'Shown on a track that is still being processed — just uploaded, waveform still being made, or re-processing after an edit. `inline` for list rows, `overlay` over cover art, `waveform` in place of the waveform seekbar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
      'Processing',
    );
  },
};

export const Overlay: Story = {
  args: { variant: 'overlay' },
  decorators: [
    (Story) => (
      <div className="bg-primary relative size-24 overflow-hidden rounded-md">
        <Story />
      </div>
    ),
  ],
};

export const Waveform: Story = {
  args: { variant: 'waveform' },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
};
