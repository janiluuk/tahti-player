import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminReportsView } from '@tahti-web/views/admin/AdminReportsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminReportsView> = {
  title: 'Tahti/Admin/AdminReportsView',
  component: AdminReportsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Missing states: “No annual reports generated yet” still a bare <p> — swap to PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/reports'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminReportsView />
    </div>
  ),
};
