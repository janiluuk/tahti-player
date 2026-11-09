import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistUpcomingEvents } from '@tahti-web/components/artist-view/ArtistUpcomingEvents';
import { expect, within } from 'storybook/test';

import { ARTIST_EVENTS } from './_fixtures/artist';
import { withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof ArtistUpcomingEvents> = {
  title: 'Tahti/Artist/ArtistUpcomingEvents',
  component: ArtistUpcomingEvents,
  parameters: {
    layout: 'padded',
    mockData: mockData({ channelEvents: ARTIST_EVENTS }),
    docs: {
      description: {
        component:
          "The artist's upcoming gigs on the Stage tab, from `GET /api/channels/:slug/events` (own events plus accepted tags). Titles open the public event page; cancelled events keep a badge; Subscribe is the artist's .ics feed.",
      },
    },
  },
  args: { channelSlug: 'northern-lights', username: 'northern-lights' },
  decorators: [withTahtiRouter('/channel/northern-lights')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEvents: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole('region', {
      name: 'Upcoming events',
    });
    await expect(
      within(section).getByRole('link', {
        name: /Polar Static live at Kuudes Linja/,
      }),
    ).toHaveAttribute('href', `/events/${ARTIST_EVENTS[0]!.id}`);
    await expect(
      within(section).getByRole('link', { name: /Subscribe/ }),
    ).toBeVisible();
    await expect(
      within(section).getByText('Boathouse Sessions Vol. 3'),
    ).toBeVisible();
  },
};

export const NoEvents: Story = {
  parameters: { mockData: mockData({ channelEvents: [] }) },
};
