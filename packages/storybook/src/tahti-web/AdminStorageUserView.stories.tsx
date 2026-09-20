import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStorageUserView } from '@tahti-web/views/admin/AdminStorageUserView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStorageUserView> = {
  title: 'Tahti/Admin/AdminStorageUserView',
  component: AdminStorageUserView,
  parameters: { layout: 'fullscreen' },
  // Route param — the mock storage fixture (admin-storage.ts) is keyed by
  // specific ids ('u-1'/'u-2'/'u-3'), not any plausible-looking string; an
  // unknown id resolves to null and renders the "Could not load" error.
  decorators: [withTahtiRouter('/admin/storage/u-1'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStorageUserView userId="u-1" />
    </div>
  ),
};
