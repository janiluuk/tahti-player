import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminMissedShowsPanel } from '@tahti-web/views/admin/AdminMissedShowsView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

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

export const Queue: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No missed shows in this view'),
    ).toBeVisible();
    await expect(canvas.getByText('Queue · 0')).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await selectTab(canvas, 'Open');
    await expect(
      await canvas.findByText('No missed shows in this view'),
    ).toBeVisible();
  },
};
