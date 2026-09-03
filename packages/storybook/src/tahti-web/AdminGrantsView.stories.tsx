import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGrantsView } from '@tahti-web/views/admin/AdminGrantsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminGrantsView> = {
  title: 'Tahti/Admin/AdminGrantsView',
  component: AdminGrantsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: empty cycles → PageEmpty. Grant EUR stays StatNumber. Grant cycle $year story not added.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/grants'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminGrantsView />
    </div>
  ),
};
