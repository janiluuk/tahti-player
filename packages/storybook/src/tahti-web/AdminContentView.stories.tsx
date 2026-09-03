import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminContentView } from '@tahti-web/views/admin/AdminContentView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminContentView> = {
  title: 'Tahti/Admin/AdminContentView',
  component: AdminContentView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Missing states: catalog and recordings empty copy still hand-rolled — swap to PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/content'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminContentView />
    </div>
  ),
};
