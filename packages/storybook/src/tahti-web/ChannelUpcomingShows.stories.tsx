import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelUpcomingShows } from '@tahti-web/components/channel-view';
import { expect, waitFor, within } from 'storybook/test';

import { CHANNEL_SLUG, isoFromNow } from './_fixtures/channel';
import { mockData } from './_lib/mock-data';

const DAY = 86_400_000;

const meta: Meta<typeof ChannelUpcomingShows> = {
  title: 'Tahti/Channel/ChannelUpcomingShows',
  component: ChannelUpcomingShows,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A channel's next public live shows (up to ten) with each series' schedule note. Hidden when nothing is booked.",
      },
    },
  },
  args: { slug: CHANNEL_SLUG },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Booked: Story = {
  play: async ({ canvasElement }) => {
    const section = await within(canvasElement).findByRole('region', {
      name: 'Upcoming shows',
    });
    const [first, second] = within(section).getAllByRole('listitem');
    await expect(first).toHaveTextContent('Night Drive Sessions #12');
    await expect(first).toHaveTextContent('2 h');
    await expect(second).toHaveTextContent('Night Drive Sessions #13');
    await expect(section).toHaveTextContent(
      'Night Drive Sessions · Every Friday night',
    );
  },
};

export const OddDurations: Story = {
  parameters: {
    mockData: mockData({
      channelSchedule: () => ({
        shows: [
          {
            id: 'talk-1',
            seriesId: 'talk',
            startAt: isoFromNow(DAY),
            endAt: null,
            durationMin: 45,
            title: 'Boathouse Talk',
            episodeNumber: 2,
            showType: 'TALK',
          },
          {
            id: 'set-1',
            seriesId: 'set',
            startAt: isoFromNow(3 * DAY),
            endAt: null,
            durationMin: 90,
            title: 'Route 550 Live',
            episodeNumber: 3,
            showType: 'LIVE_SET',
          },
          {
            id: 'set-2',
            seriesId: 'set',
            startAt: isoFromNow(4 * DAY),
            endAt: null,
            durationMin: null,
            title: 'Open-ended jam',
            episodeNumber: null,
            showType: 'LIVE_SET',
          },
        ],
        series: [
          { id: 'talk', name: 'Boathouse Talk', scheduleNote: null },
          { id: 'set', name: 'Route 550 Live', scheduleNote: null },
        ],
      }),
    }),
  },
  play: async ({ canvasElement }) => {
    const section = await within(canvasElement).findByRole('region', {
      name: 'Upcoming shows',
    });
    const shows = within(section).getAllByRole('listitem');
    await expect(shows).toHaveLength(3);
    await expect(shows[0]).toHaveTextContent('45 min');
    await expect(shows[1]).toHaveTextContent('1 h 30 min');
    await expect(shows[2]).not.toHaveTextContent(/ min$| h$/);
  },
};

export const NothingBooked: Story = {
  parameters: {
    mockData: mockData({ channelSchedule: () => ({ shows: [], series: [] }) }),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole('region', { name: 'Upcoming shows' }),
      ).toBeNull(),
    );
  },
};
