import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackAccessGate } from '@tahti-web/views/track-detail/TrackAccessGate';
import { expect, fn, userEvent, within } from 'storybook/test';

import { STORY_TIER_ID } from './_fixtures/track-release';
import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof TrackAccessGate> = {
  title: 'Tahti/Track/TrackAccessGate',
  component: TrackAccessGate,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Replaces the player on the public track page when the viewer may not stream the track: fan-subscribers-only, or sold through a one-time purchase tier. Signed-out viewers are asked to sign in first in case they already have access.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-lg bg-neutral-800 p-6 text-white">
        <Story />
      </div>
    ),
    withTahtiRouter('/t/northern-lights-archive-1'),
  ],
  args: {
    gate: { reason: 'SUBSCRIBERS_ONLY' },
    artist: { username: 'northern-lights', displayName: 'Northern Lights' },
    signedIn: true,
    onBuy: fn(),
    onSignIn: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SubscribersOnly: Story = {
  play: async ({ canvasElement }) => {
    const gate = within(
      within(canvasElement).getByRole('region', {
        name: 'Fan subscribers only',
      }),
    );
    await expect(
      gate.getByText(
        'Northern Lights shares this track with their fan subscribers.',
      ),
    ).toBeVisible();
    await expect(
      gate.getByRole('link', { name: 'Subscribe to listen' }),
    ).toHaveAttribute('href', '/subscribe/northern-lights');
  },
};

export const SubscribersOnlySignedOut: Story = {
  args: { signedIn: false },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Sign in to listen' }),
    );
    await expect(args.onSignIn).toHaveBeenCalled();
  },
};

export const Purchase: Story = {
  args: {
    gate: { reason: 'PURCHASE', tierId: STORY_TIER_ID },
    priceCents: 300,
  },
  play: async ({ canvasElement, args }) => {
    const gate = within(
      within(canvasElement).getByRole('region', { name: 'Buy to listen' }),
    );
    await expect(gate.getByText(/Buy this track \(€3\.00\)/)).toBeVisible();
    await userEvent.click(gate.getByRole('button', { name: 'Buy this track' }));
    await expect(args.onBuy).toHaveBeenCalled();
    await expect(
      gate.getByRole('link', { name: 'Subscribe instead' }),
    ).toBeVisible();
  },
};

export const PurchasePayWhatYouWant: Story = {
  args: {
    gate: { reason: 'PURCHASE', tierId: STORY_TIER_ID },
    priceCents: 300,
    priceOptional: true,
  },
};

export const PurchaseBusy: Story = {
  args: {
    gate: { reason: 'PURCHASE', tierId: STORY_TIER_ID },
    priceCents: 300,
    buyBusy: true,
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Buying…' }),
    ).toBeDisabled();
  },
};

// Signed out, purchase: sign in first; no Buy button until then.
export const PurchaseSignedOut: Story = {
  args: {
    gate: { reason: 'PURCHASE', tierId: STORY_TIER_ID },
    priceCents: 300,
    signedIn: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Sign in to listen' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Buy this track' }),
    ).toBeNull();
  },
};
