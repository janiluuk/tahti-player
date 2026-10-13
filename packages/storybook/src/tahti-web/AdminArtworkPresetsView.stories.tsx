import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminArtworkPresetsView } from '@tahti-web/views/admin/AdminArtworkPresetsView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const meta: Meta<typeof AdminArtworkPresetsView> = {
  title: 'Tahti/Admin/AdminArtworkPresetsView',
  component: AdminArtworkPresetsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/artwork-presets'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const render = () => (
  <div className="p-6">
    <AdminArtworkPresetsView />
  </div>
);

/** Sixteen default artwork slots, each editable. */
export const Default: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Artwork presets' }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: /^Edit Artwork \d+$/ }),
    ).toHaveLength(16);
    await expect(
      canvas.getByRole('button', { name: 'Add new artwork' }),
    ).toBeVisible();
  },
};

/** Clicking a slot opens its editor, named after the slot. */
export const EditSlot: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit Artwork 3' }),
    );
    const dialog = await findDialog(canvasElement, 'Artwork 3');
    await expect(
      dialog.getByRole('textbox', { name: 'Editing slot' }),
    ).toHaveValue('Artwork 3');
    await expect(
      dialog.getByRole('button', { name: 'Upload artwork for Artwork 3' }),
    ).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};

/** Reset asks for confirmation before clearing custom assignments. */
export const ConfirmReset: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset to defaults' }),
    );
    const confirm = await findDialog(canvasElement, 'Reset artwork presets?');
    await expect(confirm.getByRole('button', { name: 'Reset' })).toBeVisible();
  },
};
