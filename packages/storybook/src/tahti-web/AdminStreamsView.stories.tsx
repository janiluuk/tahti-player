import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStreamsView } from '@tahti-web/views/admin/AdminStreamsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStreamsView> = {
  title: 'Tahti/Admin/AdminStreamsView',
  component: AdminStreamsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Wraps AdminStreamManagerPanel. Leave.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/streams'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStreamsView />
    </div>
  ),
};
