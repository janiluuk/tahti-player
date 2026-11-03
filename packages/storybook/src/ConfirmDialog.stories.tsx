import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { ConfirmDialog } from '@tahti-player/ui';

import { findDialog } from './tahti-web/_lib/play';

const meta = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    title: 'Publish this release?',
    description: 'Followers are notified and the release goes public.',
    confirmLabel: 'Publish',
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Publish this release?');
    const confirm = dialog.getByRole('button', { name: 'Publish' });
    await expect(confirm.className).not.toContain('bg-accent-red');
    await userEvent.click(confirm);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const Destructive: Story = {
  args: {
    destructive: true,
    title: 'Delete this playlist?',
    description: 'The playlist and its order are gone for good.',
    confirmLabel: 'Delete',
  },
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Delete this playlist?');
    const confirm = dialog.getByRole('button', { name: 'Delete' });
    await expect(confirm.className).toContain('bg-accent-red');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};
