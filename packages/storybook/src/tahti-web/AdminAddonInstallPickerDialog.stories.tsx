import type { Meta, StoryObj } from '@storybook/react-vite';
import { InstallPickerDialog } from '@tahti-web/views/admin/addons/InstallPickerDialog';
import { expect, fn, userEvent } from 'storybook/test';

import {
  ADMIN_ADDON_LIVE_STATUS,
  ADMIN_ADDON_SIGNUPS,
} from './_fixtures/admin-addons';
import { findDialog } from './_lib/play';

const meta: Meta<typeof InstallPickerDialog> = {
  title: 'Tahti/Admin/AdminAddonInstallPickerDialog',
  component: InstallPickerDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    candidates: [ADMIN_ADDON_LIVE_STATUS, ADMIN_ADDON_SIGNUPS],
    pending: false,
    error: null,
    onCancel: fn(),
    onInstall: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DIALOG_NAME = 'Install a widget onto this surface';

/** The first candidate is preselected; picking another installs that one. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    const picker = dialog.getByRole('radiogroup', {
      name: 'Widget to install',
    });
    await expect(picker).toBeVisible();
    await expect(
      dialog.getByRole('radio', { name: 'Live status' }),
    ).toBeChecked();

    await userEvent.click(dialog.getByRole('radio', { name: 'Signups today' }));
    await expect(
      dialog.getByRole('radio', { name: 'Signups today' }),
    ).toBeChecked();
    await userEvent.click(dialog.getByRole('button', { name: 'Install' }));
    await expect(args.onInstall).toHaveBeenCalledWith('addon-signups');
  },
};

/** Everything approved is already installed: nothing to pick. */
export const NothingToInstall: Story = {
  args: { candidates: [] },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      dialog.getByText(
        /Every approved Admin-surface add-on is already installed/,
      ),
    ).toBeVisible();
    await expect(dialog.queryByRole('radiogroup')).toBeNull();
    await expect(
      dialog.getByRole('button', { name: 'Install' }),
    ).toBeDisabled();
  },
};

export const InstallFailed: Story = {
  args: { error: 'This widget is already installed on the surface.' },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'This widget is already installed on the surface.',
    );
  },
};
