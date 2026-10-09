import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminVendorsContent } from '@tahti-web/views/admin/AdminVendorsView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

// Vendors is now only a tab on the Admin dashboard (AdminDashboardView),
// not its own nav-level page — /admin/vendors redirects to
// /admin?tab=vendors. This story renders the tab's content directly.
const meta: Meta<typeof AdminVendorsContent> = {
  title: 'Tahti/Admin/AdminVendorsView',
  component: AdminVendorsContent,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="admin-page-layout mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <AdminVendorsContent />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        name: '5 launch blockers · 8 checks pending',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Critical vendors' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Integrations' }),
    ).toBeVisible();
    await expect(canvas.getAllByText('Stripe').length).toBeGreaterThan(0);
  },
};
