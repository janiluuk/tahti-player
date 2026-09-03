import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminTopListsView } from '@tahti-web/views/admin/AdminTopListsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminTopListsView> = {
  title: 'Tahti/Admin/AdminTopListsView',
  component: AdminTopListsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: FilterRow → FilterChips; search Input startAddon SearchIcon. Rankings already TopList. Missing states: empty still PageEmpty vs FilterChips combo.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/top-lists'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminTopListsView />
    </div>
  ),
};
