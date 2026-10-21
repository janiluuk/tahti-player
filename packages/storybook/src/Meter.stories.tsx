import { Meta, StoryObj } from '@storybook/react-vite';

import { Meter } from '@tahti-player/ui';

const meta = {
  title: 'Components/Meter',
  component: Meter,
  tags: ['autodocs'],
} satisfies Meta<typeof Meter>;

export default meta;

type Story = StoryObj<typeof Meter>;

export const Default: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-4">
      <Meter value={12} />
      <Meter value={50} />
      <Meter value={92} />
      <Meter value={140} />
      <Meter value={30} max={40} />
    </div>
  ),
};
