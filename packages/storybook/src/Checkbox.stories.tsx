import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Checkbox } from '@tahti-player/ui';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Select track',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const box = within(canvasElement).getByRole('checkbox', {
      name: 'Select track',
    });
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(within(canvasElement).getByText('Select track'));
    await expect(box).not.toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Select Northern Lights',
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('checkbox', {
        name: 'Select Northern Lights',
      }),
    ).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    label: 'Processing',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('checkbox', { name: 'Processing' }),
    ).toBeDisabled();
  },
};
