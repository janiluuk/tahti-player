import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminUsersView } from '@tahti-web/views/admin/AdminUsersView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminUsersView> = {
  title: 'Tahti/Admin/AdminUsersView',
  component: AdminUsersView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: search overlay pl-9 → Input startAddon SearchIcon; empty “No users match” → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/users'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminUsersView />
    </div>
  ),
};
