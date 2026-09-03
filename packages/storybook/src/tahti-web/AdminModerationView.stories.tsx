import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminModerationView } from '@tahti-web/views/admin/moderation/AdminModerationView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminModerationView> = {
  title: 'Tahti/Admin/AdminModerationView',
  component: AdminModerationView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: Support search startAddon; tab empty copy → PageEmpty. Leave dense queue tables. Missing states: Selects is not a moderation tab (lives at /admin/tahti-selects).`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/moderation'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// No `tab` prop -> defaults to the "support" tab (DEFAULT_ADMIN_MODERATION_TAB).
export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminModerationView />
    </div>
  ),
};

export const BetaApplicationsTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminModerationView tab="beta" />
    </div>
  ),
};

export const FeatureRequestsTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminModerationView tab="feature-requests" />
    </div>
  ),
};
