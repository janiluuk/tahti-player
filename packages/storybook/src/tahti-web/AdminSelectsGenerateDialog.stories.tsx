import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectsGenerateDialog } from '@tahti-web/views/admin/moderation/tabs/SelectsGenerateDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { findDialog } from './_lib/play';

const meta: Meta<typeof SelectsGenerateDialog> = {
  title: 'Tahti/Admin/AdminSelectsGenerateDialog',
  component: SelectsGenerateDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    rotationSize: 24,
    onClose: fn(),
    onGenerated: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DIALOG_NAME = 'Fill from the top list';

/** Admin → Moderation → Tahti Selects: append the top list to the rotation. */
export const AddToEnd: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      dialog.getByRole('radio', { name: 'Add to the end' }),
    ).toBeChecked();
    await expect(dialog.queryByText(/This removes all/)).toBeNull();
    await userEvent.click(dialog.getByRole('button', { name: 'Add tracks' }));
    await waitFor(() =>
      expect(args.onGenerated).toHaveBeenCalledWith(
        'Added 10 tracks from the top list.',
      ),
    );
  },
};

/** Replacing warns how many rotation tracks are about to go. */
export const ReplaceRotation: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await userEvent.click(
      dialog.getByRole('radio', { name: 'Replace the rotation' }),
    );
    await expect(
      dialog.getByText('This removes all 24 tracks in the current rotation.'),
    ).toBeVisible();
    await userEvent.click(
      dialog.getByRole('button', { name: 'Replace rotation' }),
    );
    await waitFor(() =>
      expect(args.onGenerated).toHaveBeenCalledWith(
        'Replaced the rotation with 10 tracks from the top list.',
      ),
    );
  },
};

/** An empty rotation has nothing to lose, so replacing shows no warning. */
export const EmptyRotation: Story = {
  args: { rotationSize: 0 },
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await userEvent.click(
      dialog.getByRole('radio', { name: 'Replace the rotation' }),
    );
    await expect(dialog.queryByText(/This removes all/)).toBeNull();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};
