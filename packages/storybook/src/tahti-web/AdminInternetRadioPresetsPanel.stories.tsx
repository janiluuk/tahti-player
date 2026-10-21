import type { Meta, StoryObj } from '@storybook/react-vite';
import { InternetRadioPresetsPanel } from '@tahti-web/views/admin/InternetRadioPresetsPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof InternetRadioPresetsPanel> = {
  title: 'Tahti/Admin/InternetRadioPresetsPanel',
  component: InternetRadioPresetsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Admin → Radio: internet radio stations offered as Listen page defaults to every visitor.',
      },
    },
  },
  decorators: [withTahtiRouter('/admin/radio'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Six stations, all enabled for everyone. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        name: 'Internet radio — Listen page defaults (6)',
      }),
    ).toBeVisible();
    await expect(canvas.getByText('YleX')).toBeVisible();
    await expect(canvas.getAllByText('Enabled for everyone')).toHaveLength(6);
    await expect(
      canvas.getAllByRole('button', { name: 'Disable' }),
    ).toHaveLength(6);
  },
};

export const AddStation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('YleX');
    await userEvent.click(canvas.getByRole('button', { name: 'Add station' }));
    const dialog = await findDialog(
      canvasElement,
      'Add internet radio station',
    );
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue('');
    await expect(
      dialog.getByRole('textbox', { name: 'Stream URL' }),
    ).toBeVisible();
  },
};

/** Edit opens the same editor, prefilled with the station. */
export const EditStation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('YleX');
    await userEvent.click(canvas.getAllByRole('button', { name: 'Edit' })[0]!);
    const dialog = await findDialog(canvasElement, 'Edit station');
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'YleX',
    );
    await expect(
      dialog.getByRole('button', { name: 'Save changes' }),
    ).toBeVisible();
  },
};
