import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStorageUserView } from '@tahti-web/views/admin/AdminStorageUserView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStorageUserView> = {
  title: 'Tahti/Admin/AdminStorageUserView',
  component: AdminStorageUserView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: load error / no files → PageError / PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  // Route param — the mock API layer's fixture data is keyed generically
  // rather than per-id, so any plausible-looking user id resolves.
  decorators: [withTahtiRouter('/admin/storage/mock-user-1'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStorageUserView userId="mock-user-1" />
    </div>
  ),
};
