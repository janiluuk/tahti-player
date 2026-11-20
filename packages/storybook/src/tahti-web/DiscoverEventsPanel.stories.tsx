import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoverEventsPanel } from '@tahti-web/components/discover/DiscoverEventsPanel';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof DiscoverEventsPanel> = {
  title: 'Tahti/Discover/DiscoverEventsPanel',
  component: DiscoverEventsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Discover → Events (`/discover?tab=events`, `GET /api/v1/events/upcoming`): upcoming public events from every host as banner cards (default artwork when there is no banner) with time in the event time zone and the venue. Post event opens `/events/new` when signed in and the sign-in dialog when signed out.',
      },
    },
  },
  decorators: [withTahtiRouter('/discover?tab=events')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', {
        name: 'Aurora Drift b2b Northern Lights',
      }),
    ).toHaveAttribute('href', '/events/evt-mock-guest');
    await expect(canvas.getByText('Kaiku, Helsinki, Finland')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Post event' }),
    ).toHaveAttribute('href', '/events/new');
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', {
        name: 'Aurora Drift b2b Northern Lights',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Post event' }),
    ).toBeVisible();
    await expect(canvas.getByText('Sign in to post an event.')).toBeVisible();
  },
};
