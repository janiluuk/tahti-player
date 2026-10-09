import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminAnnouncementsView } from '@tahti-web/views/admin/AdminAnnouncementsView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminAnnouncementsView> = {
  title: 'Tahti/Admin/AdminAnnouncementsView',
  component: AdminAnnouncementsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/announcements'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminAnnouncementsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Announcements' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Welcome to Tahti')).toBeVisible();
    await expect(canvas.getByText('AGM reminder — October')).toBeVisible();
    await expect(canvas.getByText('Choose audio')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'Trim' })).toHaveLength(
      2,
    );
  },
};
