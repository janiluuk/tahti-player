import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStorageView } from '@tahti-web/views/admin/AdminStorageView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStorageView> = {
  title: 'Tahti/Admin/AdminStorageView',
  component: AdminStorageView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: files search startAddon; Group by user → Toggle; five empty/error <p> → PageEmpty/PageError. StatChip used/free/total already.`,
      },
    },
  },
  tags: ['autodocs'],
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
};
