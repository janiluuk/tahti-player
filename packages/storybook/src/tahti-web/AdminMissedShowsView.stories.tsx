import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminMissedShowsPanel } from '@tahti-web/views/admin/AdminMissedShowsView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminMissedShowsPanel> = {
  title: 'Tahti/Admin/AdminMissedShowsView',
  component: AdminMissedShowsPanel,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  // /admin/missed-shows redirects to /admin/moderation/$tab (router.tsx);
  // point the decorator at the surviving route so it isn't testing a dead path.
  decorators: [
    withTahtiRouter('/admin/moderation/missed-shows'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Queue: Story = {};
