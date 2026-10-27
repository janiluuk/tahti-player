import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationsView } from '@tahti-web/views/NotificationsView';
import { expect, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof NotificationsView> = {
  title: 'Tahti/Social/NotificationsView',
  component: NotificationsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The whole notification inbox at `/notifications` (the top-bar bell shows the latest and links here): unread count, Mark all read, a notice that needs acknowledging, Mark read per row and older pages.',
      },
    },
  },
  decorators: [
    withMockAuth(),
    withPageSurface(),
    withTahtiRouter('/notifications'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Inbox: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = await canvas.findByRole('list', { name: 'Notifications' });
    await expect(
      within(list).getByText('Review the updated community guidelines'),
    ).toBeInTheDocument();
    await expect(
      within(list).getByText('Needs acknowledgement'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Mark all read' }),
    ).toBeInTheDocument();
  },
};
