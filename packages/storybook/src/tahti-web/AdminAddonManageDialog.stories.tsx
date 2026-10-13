import type { Meta, StoryObj } from '@storybook/react-vite';
import { ManageDialog } from '@tahti-web/views/admin/addons/ManageDialog';
import { expect, fn, userEvent } from 'storybook/test';

import { ADMIN_ADDON } from './_fixtures/admin-addons';
import { findDialog } from './_lib/play';

const meta: Meta<typeof ManageDialog> = {
  title: 'Tahti/Admin/AdminAddonManageDialog',
  component: ManageDialog,
  tags: ['autodocs'],
  args: {
    addon: { ...ADMIN_ADDON, defaultConfigJson: { refreshSeconds: 30 } },
    pending: false,
    error: null,
    onClose: fn(),
    onSetEnabledByDefault: fn(),
    onSetDefaultConfig: fn(),
    onDisable: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DIALOG_NAME = 'Manage Channel stats';

/** Default-on switch and the default settings JSON every new install gets. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      dialog.getByText(/Renders for every artist surface/),
    ).toBeVisible();
    const toggle = dialog.getByRole('switch', { name: 'Enabled by default' });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(args.onSetEnabledByDefault).toHaveBeenCalledWith(
      args.addon,
      false,
    );

    const config = dialog.getByPlaceholderText('{}');
    await expect(config).toHaveValue('{\n  "refreshSeconds": 30\n}');
    await userEvent.clear(config);
    await userEvent.type(config, '{{"refreshSeconds": 60}');
    await userEvent.click(
      dialog.getByRole('button', { name: 'Save settings' }),
    );
    await expect(args.onSetDefaultConfig).toHaveBeenCalledWith(
      args.addon,
      '{"refreshSeconds": 60}',
    );
  },
};

/** Invalid JSON is caught in the dialog and never sent. */
export const InvalidJson: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    const config = dialog.getByPlaceholderText('{}');
    await userEvent.clear(config);
    await userEvent.type(config, 'not json');
    await userEvent.click(
      dialog.getByRole('button', { name: 'Save settings' }),
    );
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'Not valid JSON.',
    );
    await expect(args.onSetDefaultConfig).not.toHaveBeenCalled();
  },
};

/** Disabling asks for confirmation first. */
export const ConfirmDisable: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await userEvent.click(
      dialog.getByRole('button', { name: 'Disable add-on' }),
    );
    const confirm = await findDialog(canvasElement, 'Disable "Channel stats"?');
    await expect(
      confirm.getByText(/Only a fresh bundle publish brings it back/),
    ).toBeVisible();
    await expect(args.onDisable).not.toHaveBeenCalled();
    await userEvent.click(confirm.getByRole('button', { name: 'Disable' }));
    await expect(args.onDisable).toHaveBeenCalledWith(args.addon);
  },
};

export const SaveFailed: Story = {
  args: { error: 'Could not save the default settings' },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'Could not save the default settings',
    );
  },
};
