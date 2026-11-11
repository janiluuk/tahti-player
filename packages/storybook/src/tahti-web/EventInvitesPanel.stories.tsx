import type { Meta, StoryObj } from '@storybook/react-vite';
import { EventInvitesPanel } from '@tahti-web/components/events/EventInvitesPanel';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof EventInvitesPanel> = {
  title: 'Tahti/Events/EventInvitesPanel',
  component: EventInvitesPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Studio → Events → Invites: events other artists tagged you on (`GET /api/me/event-invites`). Accepting lists the event on your channel too.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/schedule?show=events'),
    withMockAuth(MOCK_USERS.artist),
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
    await expect(canvas.getByRole('button', { name: 'Accept' })).toBeVisible();
  },
};

export const Accept: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Accept' }),
    );
    await expect(await canvas.findByText('Accepted')).toBeVisible();
  },
};
