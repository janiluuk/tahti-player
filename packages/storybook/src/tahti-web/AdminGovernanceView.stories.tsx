import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGovernanceView } from '@tahti-web/views/admin/AdminGovernanceView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminGovernanceView> = {
  title: 'Tahti/Admin/AdminGovernanceView',
  component: AdminGovernanceView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: KPI tiles → StatChip; voting empty → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/governance'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminGovernanceView />
    </div>
  ),
};
