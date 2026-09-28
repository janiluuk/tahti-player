import type { Meta, StoryObj } from '@storybook/react-vite';

import { PulsingText } from '@tahti-player/ui';

const meta: Meta<typeof PulsingText> = {
  title: 'Components/PulsingText',
  component: PulsingText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof PulsingText>>;

export const Default: Story = {
  args: {
    text: 'Live now',
    className: 'font-display text-lg font-bold',
  },
};

export const FastCycle: Story = {
  args: {
    text: 'On air',
    staggerOffset: 0.06,
    cyclePause: 1.5,
    className: 'font-display text-2xl font-bold text-accent-red-strong',
  },
};
