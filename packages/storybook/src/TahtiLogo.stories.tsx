import type { Meta, StoryObj } from '@storybook/react-vite';

import { TahtiLogo } from '@tahti-player/ui';

const meta = {
  title: 'Components/TahtiLogo',
  component: TahtiLogo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tahti brand component. App chrome uses the mark-only variant.',
      },
    },
  },
} satisfies Meta<typeof TahtiLogo>;

export default meta;
type Story = StoryObj<typeof TahtiLogo>;

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <TahtiLogo {...args} />
      <TahtiLogo {...args} markOnly />
    </div>
  ),
};
