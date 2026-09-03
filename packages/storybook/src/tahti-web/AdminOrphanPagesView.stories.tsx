import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminOrphanPagesView } from '@tahti-web/views/admin/orphanPages/AdminOrphanPagesView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminOrphanPagesView> = {
  title: 'Tahti/Admin/AdminOrphanPagesView',
  component: AdminOrphanPagesView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Tabs already Nuclear Tabs. Next: Radio station suggestions empty copy → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/orphan-pages'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminOrphanPagesView />
    </div>
  ),
};
