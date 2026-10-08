import type { Meta, StoryObj } from '@storybook/react-vite';

import { ALL_VISUALIZER_MODES, VisualizerHost } from '@tahti-player/visualizer';

const meta = {
  title: 'Audio/VisualizerHost',
  component: VisualizerHost,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="bg-background text-foreground w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    mode: { control: 'select', options: [...ALL_VISUALIZER_MODES] },
  },
  args: {
    className: 'h-80 w-full',
  },
} satisfies Meta<typeof VisualizerHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spectrum: Story = { args: { mode: 'spectrum' } };
export const Oscilloscope: Story = { args: { mode: 'oscilloscope' } };
export const Radial: Story = { args: { mode: 'radial' } };
export const Quantum: Story = { args: { mode: 'quantum' } };
export const Orb: Story = { args: { mode: 'orb' } };
export const Cymatics: Story = { args: { mode: 'cymatics' } };
export const LandscapeChrome: Story = { args: { mode: 'landscape-chrome' } };
export const LandscapeFerrofluid: Story = {
  args: { mode: 'landscape-ferrofluid' },
};
