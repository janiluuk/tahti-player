import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelListeningPartyBanner } from '@tahti-web/components/channel-view';
import { expect, waitFor, within } from 'storybook/test';

import { CHANNEL_SLUG } from './_fixtures/channel';
import { withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof ChannelListeningPartyBanner> = {
  title: 'Tahti/Channel/ChannelListeningPartyBanner',
  component: ChannelListeningPartyBanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A channel's live listening party, or its next scheduled one, under the channel hero, linking to `/party/$id`. Renders nothing when there is none.",
      },
    },
  },
  args: { slug: CHANNEL_SLUG },
  decorators: [withTahtiRouter(`/channel/${CHANNEL_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveNow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByText('Listening party · live now')).toBeVisible(),
    );
    await expect(
      canvas.getByRole('link', { name: 'Join now' }),
    ).toHaveAttribute('href', '/party/lp-mock-live');
  },
};

export const Upcoming: Story = {
  parameters: {
    mockData: mockData({
      channelListeningParties: (base) =>
        base.filter((row) => row.state === 'SCHEDULED'),
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('link', { name: 'Open party' }),
    ).toHaveAttribute('href', '/party/lp-mock-scheduled');
  },
};

export const NoParty: Story = {
  parameters: {
    mockData: mockData({ channelListeningParties: () => [] }),
  },
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(
      within(canvasElement).queryByRole('region', { name: 'Listening party' }),
    ).toBeNull();
  },
};
