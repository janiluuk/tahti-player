import type { Meta, StoryObj } from '@storybook/react-vite';
import { PublishDialog } from '@tahti-web/views/admin/addons/PublishDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { ADMIN_ADDON } from './_fixtures/admin-addons';
import { findDialog } from './_lib/play';

const meta: Meta<typeof PublishDialog> = {
  title: 'Tahti/Admin/AdminAddonPublishDialog',
  component: PublishDialog,
  tags: ['autodocs'],
  args: {
    addon: ADMIN_ADDON,
    pending: false,
    error: null,
    onCancel: fn(),
    onPublish: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DIALOG_NAME = 'Publish a version of Channel stats';

/** Uploads a new widget bundle version; the next patch version is prefilled. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(dialog.getByLabelText('Version')).toHaveValue('1.2.1');
    const publish = dialog.getByRole('button', { name: 'Publish for review' });
    await expect(publish).toBeDisabled();

    const bundle = new File(['export default {};'], 'channel-stats.mjs', {
      type: 'text/javascript',
    });
    await userEvent.upload(dialog.getByLabelText('Widget bundle'), bundle);
    await expect(dialog.getByText(/channel-stats\.mjs · \d+ B/)).toBeVisible();
    await userEvent.type(
      dialog.getByPlaceholderText('What changed in this version?'),
      'Faster refresh',
    );
    await waitFor(() => expect(publish).toBeEnabled());
    await userEvent.click(publish);
    await expect(args.onPublish).toHaveBeenCalledWith(ADMIN_ADDON, {
      version: '1.2.1',
      changelog: 'Faster refresh',
      file: bundle,
    });
  },
};

/** A malformed version shows an inline hint; Cancel closes the dialog. */
export const InvalidVersion: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    const version = dialog.getByLabelText('Version');
    await userEvent.clear(version);
    await userEvent.type(version, 'v2');
    await expect(dialog.getByText('Use the form 1.0.0')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalled();
  },
};

export const Publishing: Story = {
  args: { pending: true },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      dialog.getByRole('button', { name: 'Publishing…' }),
    ).toBeDisabled();
  },
};

export const Rejected: Story = {
  args: { error: 'Bundle is not a syntactically valid ES module' },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'Bundle is not a syntactically valid ES module',
    );
  },
};
