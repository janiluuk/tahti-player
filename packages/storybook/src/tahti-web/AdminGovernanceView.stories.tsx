import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGovernanceView } from '@tahti-web/views/admin/AdminGovernanceView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminGovernanceView> = {
  title: 'Tahti/Admin/AdminGovernanceView',
  component: AdminGovernanceView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/governance'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// No `tab` prop -> defaults to the "overview" tab (DEFAULT_ADMIN_GOVERNANCE_TAB).
export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminGovernanceView />
    </div>
  ),
};

export const ReportsTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminGovernanceView tab="reports" />
    </div>
  ),
};

export const GrantsTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminGovernanceView tab="grants" />
    </div>
  ),
};

export const AgmTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminGovernanceView tab="agm" />
    </div>
  ),
};
