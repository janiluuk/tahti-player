import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackdropUploadButton } from '@tahti-web/components/BackdropUploadButton';
import { expect, userEvent } from 'storybook/test';

import { findDialog, openDialog } from './_lib/play';

const meta: Meta<typeof BackdropUploadButton> = {
  title: 'Tahti/Media/BackdropUploadButton',
  component: BackdropUploadButton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Backdrop',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: null },
};

/** Hover the backdrop to reveal the corner delete (X) badge. */
export const Set: Story = {
  args: { value: 'https://picsum.photos/seed/backdrop-wide/900/300' },
};

export const PreviewModalOpen: Story = {
  args: { value: 'https://picsum.photos/seed/backdrop-wide/900/300' },
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Backdrop');
    await expect(preview.getByRole('img', { name: 'Backdrop' })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Change' })).toBeVisible();
  },
};

export const ConfirmDelete: Story = {
  args: { value: 'https://picsum.photos/seed/backdrop-wide/900/300' },
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Backdrop');
    await userEvent.click(preview.getByRole('button', { name: 'Delete' }));
    const confirm = await findDialog(canvasElement, 'Remove backdrop?');
    await expect(confirm.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};
