import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubscribeView } from '@tahti-web/views/SubscribeView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof SubscribeView> = {
  title: 'Tahti/Artist/SubscribeView',
  component: SubscribeView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Fan subscription page (`/subscribe/$username`): the artist header, their monthly tiers with perks and a Subscribe button each (Stripe checkout), a log in / join prompt when signed out, the viewer's current subscription in place of the tiers, and thank-you / cancelled notices after checkout returns.",
      },
    },
  },
  args: { username: 'northern-lights' },
  decorators: [
    withTahtiRouter('/subscribe/northern-lights'),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        level: 2,
        name: 'Subscribe to Northern Lights',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Log in or join Tahti to subscribe.'),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Join' })).toBeVisible();
    await expect(canvas.getByText('Supporter')).toBeVisible();
    await expect(canvas.getByText('€5/mo')).toBeVisible();
    await expect(canvas.getByText('Patron')).toBeVisible();
    await expect(canvas.getByText('€15/mo')).toBeVisible();
    await expect(canvas.getByText('Fan chat')).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Subscribe' }),
    ).toHaveLength(2);
  },
};

/** The mock session already has an active Supporter subscription to
 * Northern Lights, so the card replaces the tier buttons. */
export const AlreadySubscribed: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByText("You're subscribed: Supporter"),
    );
    await expect(
      canvas.getByRole('button', { name: 'Manage subscription' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Subscribe' }),
    ).toBeNull();
  },
};

export const CheckoutCancelledNoTiers: Story = {
  args: { checkoutReturn: 'canceled' },
  decorators: [withMockAuth(null)],
  parameters: {
    mockData: mockData({ fanTiers: (base) => ({ ...base, tiers: [] }) }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('No active fan tiers yet.'));
    await expect(canvas.getByText('Checkout cancelled')).toBeVisible();
    await expect(
      canvas.getByText(
        "You haven't been charged. Pick a tier whenever you're ready.",
      ),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Subscribe' }),
    ).toBeNull();
  },
};
