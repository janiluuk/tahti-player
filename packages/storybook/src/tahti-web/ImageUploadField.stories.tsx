import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageUploadField } from '@tahti-web/components/ImageUploadField';
import { expect, userEvent } from 'storybook/test';

import { findDialog, openDialog } from './_lib/play';

const meta: Meta<typeof ImageUploadField> = {
  title: 'Tahti/Media/ImageUploadField',
  component: ImageUploadField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Cover image',
    description: 'JPEG, PNG, or WebP',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: '' },
};

/** Hover the thumbnail to reveal the corner delete (X) badge. */
export const Set: Story = {
  args: { value: 'https://picsum.photos/seed/upload-field/200' },
};

export const PreviewModalOpen: Story = {
  args: { value: 'https://picsum.photos/seed/upload-field/200' },
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Cover image');
    await expect(
      preview.getByRole('img', { name: 'Cover image' }),
    ).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(preview.getByRole('button', { name: 'Change' })).toBeVisible();
  },
};

export const ConfirmDelete: Story = {
  args: { value: 'https://picsum.photos/seed/upload-field/200' },
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Cover image');
    await userEvent.click(preview.getByRole('button', { name: 'Delete' }));
    const confirm = await findDialog(canvasElement, 'Remove cover image?');
    await expect(confirm.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};
