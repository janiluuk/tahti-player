import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationEventInvites } from '@tahti-web/components/app-top-nav/NotificationEventInvites';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof NotificationEventInvites> = {
  title: 'Tahti/Events/NotificationEventInvites',
  component: NotificationEventInvites,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pending event tags at the top of the notifications popover when an `EVENT_TAGGED` notification is listed. Accept and Decline answer the tag in place (`POST /api/me/event-invites/:id/accept|decline`); answered tags leave the list.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/'),
    withMockAuth(MOCK_USERS.artist),
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Kaiku Collective night'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', {
        name: 'Accept invite: Kaiku Collective night',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', {
        name: 'Decline invite: Kaiku Collective night',
      }),
    ).toBeVisible();
  },
};
