import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStatusView } from '@tahti-web/views/admin/AdminStatusView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStatusView> = {
  title: 'Tahti/Admin/AdminStatusView',
  component: AdminStatusView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: load error → PageError.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/status'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStatusView />
    </div>
  ),
};
