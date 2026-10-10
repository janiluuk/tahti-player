import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStorageView } from '@tahti-web/views/admin/AdminStorageView';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof AdminStorageView> = {
  title: 'Tahti/Admin/AdminStorageView',
  component: AdminStorageView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/storage'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStorageView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disk = await canvas.findByRole('heading', {
      name: 'Local server disk',
    });
    // The tab panel fades in from opacity 0 after the data loads.
    await waitFor(() => expect(disk).toBeVisible());
    await expect(
      canvas.getByRole('heading', { name: 'Top users by storage usage' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Edit quota for DJ Moonlight' }),
    ).toBeVisible();
    await selectTab(canvas, 'Files');
  },
};
