import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminSelectsView } from '@tahti-web/views/admin/AdminSelectsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminSelectsView> = {
  title: 'Tahti/Admin/AdminSelectsView',
  component: AdminSelectsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: archive search Input startAddon SearchIcon. Leave the rotation table. Selects lives here, not as a Moderation tab.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/tahti-selects'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminSelectsView />
    </div>
  ),
};
