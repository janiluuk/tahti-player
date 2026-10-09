import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelLiveTracklist } from '@tahti-web/components/channel-view';
import { expect, waitFor, within } from 'storybook/test';

import { CHANNEL_SLUG } from './_fixtures/channel';
import { withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof ChannelLiveTracklist> = {
  title: 'Tahti/Channel/ChannelLiveTracklist',
  component: ChannelLiveTracklist,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tracks fingerprinted so far in the live broadcast, refreshed every minute. Artists with a Tahti account link to their page; hidden while nothing has been identified.',
      },
    },
  },
  args: { slug: CHANNEL_SLUG },
  decorators: [withTahtiRouter(`/channel/${CHANNEL_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Identified: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole('region', {
      name: 'Played in this broadcast',
    });
    const rows = within(section).getAllByRole('listitem');
    await expect(rows).toHaveLength(2);
    await expect(rows[0]).toHaveTextContent('0:00');
    await expect(rows[0]).toHaveTextContent('Opening drone · Night Drive');
    await expect(rows[1]).toHaveTextContent('6:52');
    await expect(
      within(rows[1]!).getByRole('link', { name: '@nightdrive' }),
    ).toHaveAttribute('href', '/u/nightdrive');
  },
};

export const NothingIdentified: Story = {
  parameters: { mockData: mockData({ liveTracklist: () => [] }) },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole('region', {
          name: 'Played in this broadcast',
        }),
      ).toBeNull(),
    );
  },
};
