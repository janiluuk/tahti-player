import type { Meta, StoryObj } from '@storybook/react-vite';

import { SaveButton } from '@tahti-player/ui';

const meta: Meta<typeof SaveButton> = {
  title: 'Components/SaveButton',
  component: SaveButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    saving: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<Meta<typeof SaveButton>>;

export const Idle: Story = {
  args: {
    saving: false,
  },
};

export const Saving: Story = {
  args: {
    saving: true,
  },
};

export const CustomLabel: Story = {
  args: {
    label: 'Save broadcast',
    savingLabel: 'Saving broadcast…',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
