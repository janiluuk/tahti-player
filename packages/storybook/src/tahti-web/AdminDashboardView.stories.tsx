import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminDashboardView } from '@tahti-web/views/admin/AdminDashboardView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminDashboardView> = {
  title: 'Tahti/Admin/AdminDashboardView',
  component: AdminDashboardView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminDashboardView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Needs action' }),
    ).toBeVisible();
    await expect(canvas.getByText(/active members/i)).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Approve' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Verify' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Retry' })).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'System health' }),
    ).toBeVisible();
    await expect(canvas.getByText('Fan-sub payouts')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Chat and mail' }),
    ).toBeVisible();
  },
};
