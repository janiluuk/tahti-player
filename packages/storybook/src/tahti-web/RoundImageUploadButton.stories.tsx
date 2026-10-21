import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoundImageUploadButton } from '@tahti-web/components/RoundImageUploadButton';
import { expect, userEvent } from 'storybook/test';

import { findDialog, openDialog } from './_lib/play';

const meta: Meta<typeof RoundImageUploadButton> = {
  title: 'Tahti/Media/RoundImageUploadButton',
  component: RoundImageUploadButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Avatar',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: null },
};

/** Hover the circle to reveal the corner delete (X) badge. */
export const Set: Story = {
  args: { value: 'https://picsum.photos/seed/round-avatar/200' },
};

export const PreviewModalOpen: Story = {
  args: { value: 'https://picsum.photos/seed/round-avatar/200' },
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Avatar');
    await expect(preview.getByRole('img', { name: 'Avatar' })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Change' })).toBeVisible();
  },
};

export const ConfirmDelete: Story = {
  args: { value: 'https://picsum.photos/seed/round-avatar/200' },
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Avatar');
    await userEvent.click(preview.getByRole('button', { name: 'Delete' }));
    const confirm = await findDialog(canvasElement, 'Remove avatar?');
    await expect(confirm.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};
