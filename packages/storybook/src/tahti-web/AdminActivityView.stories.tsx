import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminActivityView } from '@tahti-web/views/admin/AdminActivityView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminActivityView> = {
  title: 'Tahti/Admin/AdminActivityView',
  component: AdminActivityView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} LogViewer already. Leave operational filters on LogViewer.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/activity'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminActivityView />
    </div>
  ),
};
