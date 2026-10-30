import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminArtworkPresetsView } from '@tahti-web/views/admin/AdminArtworkPresetsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

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

/** The built-in presets, each with an enable switch and remove. */
export const Default: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Artwork presets' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        canvas.getAllByRole('switch', { name: /^Enable artwork \d+$/ }),
      ).toHaveLength(16),
    );
    await expect(
      canvas.getByRole('button', { name: 'Add artwork' }),
    ).toBeVisible();
  },
};

/** Remove asks for confirmation first. */
export const ConfirmRemove: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Remove artwork 3' }),
    );
    const confirm = await findDialog(canvasElement, 'Remove this artwork?');
    await expect(confirm.getByRole('button', { name: 'Remove' })).toBeVisible();
  },
};
