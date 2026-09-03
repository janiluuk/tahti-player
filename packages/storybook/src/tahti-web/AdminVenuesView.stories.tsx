import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminVenuesView } from '@tahti-web/views/admin/AdminVenuesView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminVenuesView> = {
  title: 'Tahti/Admin/AdminVenuesView',
  component: AdminVenuesView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Missing states: load error and “No venues found” still bare <p> — swap to PageError / PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/venues'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminVenuesView />
    </div>
  ),
};
