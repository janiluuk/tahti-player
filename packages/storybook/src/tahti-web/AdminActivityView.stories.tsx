import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminActivityView } from '@tahti-web/views/admin/AdminActivityView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminActivityView> = {
  title: 'Tahti/Admin/AdminActivityView',
  component: AdminActivityView,
  parameters: { layout: 'fullscreen' },
  // /admin/activity redirects to /admin/logs (router.tsx); point the
  // decorator at the surviving route so it isn't testing a dead path.
  decorators: [withTahtiRouter('/admin/logs'), withMockAuth()],
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
