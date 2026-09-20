import { Meta, StoryObj } from '@storybook/react-vite';

import { DonutChart } from '@tahti-player/ui';

const meta = {
  title: 'Components/DonutChart',
  component: DonutChart,
  tags: ['autodocs'],
} satisfies Meta<typeof DonutChart>;

export default meta;

type Story = StoryObj<typeof DonutChart>;

export const Default: Story = {
  render: () => (
    <DonutChart
      segments={[
        { id: 'audio', value: 62, color: 'var(--accent-orange)' },
        { id: 'images', value: 24, color: 'var(--accent-purple)' },
        { id: 'other', value: 14, color: 'var(--accent-cyan)' },
      ]}
      centerLabel="Total usage"
      centerValue="86 GB"
      aria-label="Storage breakdown totaling 86 GB"
    />
  ),
};

export const NoCenterContent: Story = {
  render: () => (
    <DonutChart
      segments={[
        { id: 'a', value: 1, color: 'var(--accent-green)' },
        { id: 'b', value: 1, color: 'var(--accent-blue)' },
      ]}
      aria-label="Even split"
    />
  ),
};
