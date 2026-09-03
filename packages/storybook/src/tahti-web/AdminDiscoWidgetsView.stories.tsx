import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminDiscoWidgetsView } from '@tahti-web/views/admin/AdminDiscoWidgetsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminDiscoWidgetsView> = {
  title: 'Tahti/Admin/AdminDiscoWidgetsView',
  component: AdminDiscoWidgetsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} FilterChips already. Next: type-empty copy → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/disco-widgets'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Registers, edits, and deletes the disco-widget catalog every listener,
// artist, and admin add-on store is built from.
export const Catalog: Story = {};
