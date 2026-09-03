import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminMissedShowsPanel } from '@tahti-web/views/admin/AdminMissedShowsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminMissedShowsPanel> = {
  title: 'Tahti/Admin/AdminMissedShowsView',
  component: AdminMissedShowsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: “No missed shows” → PageEmpty.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/missed-shows'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Queue: Story = {};
