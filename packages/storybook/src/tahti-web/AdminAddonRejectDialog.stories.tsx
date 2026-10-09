import type { Meta, StoryObj } from '@storybook/react-vite';
import { RejectDialog } from '@tahti-web/views/admin/addons/RejectDialog';
import { expect, fn, userEvent } from 'storybook/test';

import { ADMIN_ADDON } from './_fixtures/admin-addons';
import { findDialog } from './_lib/play';

const meta: Meta<typeof RejectDialog> = {
  title: 'Tahti/Admin/AdminAddonRejectDialog',
  component: RejectDialog,
  tags: ['autodocs'],
  args: {
    addon: ADMIN_ADDON,
    pending: false,
    onCancel: fn(),
    onConfirm: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Rejecting needs a reason; it is trimmed before it reaches the author. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Reject Channel stats?');
    await expect(dialog.getByText(/A reason is required/)).toBeVisible();
    const reject = dialog.getByRole('button', { name: 'Reject' });
    await expect(reject).toBeDisabled();

    const note = dialog.getByPlaceholderText(
      'Why is this add-on being rejected?',
    );
    await userEvent.type(note, '   ');
    await expect(reject).toBeDisabled();
    await userEvent.type(note, 'Bundle reads cookies. ');
    await userEvent.click(reject);
    await expect(args.onConfirm).toHaveBeenCalledWith('Bundle reads cookies.');
  },
};

export const Rejecting: Story = {
  args: { pending: true },
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Reject Channel stats?');
    await userEvent.type(
      dialog.getByPlaceholderText('Why is this add-on being rejected?'),
      'Duplicate',
    );
    await expect(dialog.getByRole('button', { name: 'Reject' })).toBeDisabled();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalled();
  },
};
