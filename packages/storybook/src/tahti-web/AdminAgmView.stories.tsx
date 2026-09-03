import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminAgmView } from '@tahti-web/views/admin/AdminAgmView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminAgmView> = {
  title: 'Tahti/Admin/AdminAgmView',
  component: AdminAgmView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Toggle/CopyButton already. Next: meetings/motions/documents empty → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/agm'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminAgmView />
    </div>
  ),
};
