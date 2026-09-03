import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminAnnouncementsView } from '@tahti-web/views/admin/AdminAnnouncementsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminAnnouncementsView> = {
  title: 'Tahti/Admin/AdminAnnouncementsView',
  component: AdminAnnouncementsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Toggle already. Next: clips empty → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/announcements'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminAnnouncementsView />
    </div>
  ),
};
