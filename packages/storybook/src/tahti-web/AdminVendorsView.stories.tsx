import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminVendorsContent } from '@tahti-web/views/admin/AdminVendorsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

// Vendors is now only a tab on the Admin dashboard (AdminDashboardView),
// not its own nav-level page — /admin/vendors redirects to
// /admin?tab=vendors. This story renders the tab's content directly.
const meta: Meta<typeof AdminVendorsContent> = {
  title: 'Tahti/Admin/AdminVendorsView',
  component: AdminVendorsContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Badge status already. Leave vendor tables.`,
      },
    },
  },
  tags: ['autodocs'],
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
};
