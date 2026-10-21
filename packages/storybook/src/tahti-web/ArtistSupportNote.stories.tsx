import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistSupportNote } from '@tahti-web/components/artist-view';
import { expect, within } from 'storybook/test';

import { TIP_JAR_URL } from './_fixtures/artist';

const TIERS = [
  {
    id: 'tier-1',
    name: 'Supporter',
    amountCents: 500,
    description: 'Keeps the stream on air through the winter.',
    perks: ['FAN_CHAT'],
  },
  {
    id: 'tier-2',
    name: 'Patron',
    amountCents: 1500,
    description: null,
    perks: ['FAN_CHAT', 'FAN_NEWSLETTER', 'Monthly thank-you mix'],
  },
];

const meta: Meta<typeof ArtistSupportNote> = {
  title: 'Tahti/Artist/ArtistSupportNote',
  component: ArtistSupportNote,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Ways to support an artist on their page: fan tiers (with description and perks when the artist filled them in, otherwise a one-line price list) and the tip jar link. Renders nothing when neither exists.',
      },
    },
  },
  args: { tiers: TIERS, tipJarUrl: TIP_JAR_URL },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TiersAndTipJar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('list', { name: 'Patron perks' }),
    ).toHaveTextContent('Monthly thank-you mix');
    const tipJar = canvas.getByRole('link', { name: 'Tip jar' });
    await expect(tipJar).toHaveAttribute('href', TIP_JAR_URL);
    await expect(tipJar).toHaveAttribute('target', '_blank');
    await expect(tipJar).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const PriceListOnly: Story = {
  args: {
    tiers: TIERS.map((tier) => ({ ...tier, description: null, perks: [] })),
    tipJarUrl: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Fan tiers: Supporter (€5), Patron (€15)'),
    ).toBeVisible();
    await expect(canvas.queryByRole('link', { name: 'Tip jar' })).toBeNull();
  },
};

export const TipJarOnly: Story = {
  args: { tiers: [] },
};

// A non-http tip jar URL is dropped rather than rendered as a dead link.
export const InvalidTipJar: Story = {
  args: { tiers: [], tipJarUrl: 'javascript:alert(1)' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('link', { name: 'Tip jar' }),
    ).toBeNull();
  },
};
