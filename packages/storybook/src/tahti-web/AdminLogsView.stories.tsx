import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLogsView } from '@tahti-web/views/admin/AdminLogsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminLogsView> = {
  title: 'Tahti/Admin/AdminLogsView',
  component: AdminLogsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} LogViewer already. Next: empty copy → PageEmpty. Red warning box waits on Alert/Banner.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/logs'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminLogsView />
    </div>
  ),
};
