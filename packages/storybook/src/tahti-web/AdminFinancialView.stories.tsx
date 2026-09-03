import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminFinancialView } from '@tahti-web/views/admin/AdminFinancialView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminFinancialView> = {
  title: 'Tahti/Admin/AdminFinancialView',
  component: AdminFinancialView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: load error / no ledger → PageError / PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/financial'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminFinancialView />
    </div>
  ),
};
