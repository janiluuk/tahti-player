import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from '@tahti-player/ui';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Add a description...',
  },
};

export const Secondary: Story = {
  args: {
    tone: 'secondary',
    placeholder: 'Notes...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue:
      'A curated collection of tracks for late night coding sessions.',
  },
};

/** Label, description and error, wired like `Input`'s. */
export const WithLabel: Story = {
  args: {
    label: 'Message',
    description: 'Up to 5000 characters.',
    placeholder: 'How can we help?',
  },
};

export const WithError: Story = {
  args: {
    label: 'What is being corrected',
    error: 'Describe the correction.',
  },
};
