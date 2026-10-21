import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistUpcomingEvents } from '@tahti-web/components/artist-view/ArtistUpcomingEvents';
import { expect, within } from 'storybook/test';

import { ARTIST_EVENTS } from './_fixtures/artist';
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
          "The artist's upcoming gigs on the Stage tab, from `GET /api/channels/:slug/events`. Titles link out when the event has a URL.",
      },
    },
  },
  args: { channelSlug: 'northern-lights' },
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
    ).toHaveAttribute('href', ARTIST_EVENTS[0]!.eventUrl);
    await expect(
      within(section).getByText('Boathouse Sessions Vol. 3'),
    ).toBeVisible();
  },
};

export const NoEvents: Story = {
  parameters: { mockData: mockData({ channelEvents: [] }) },
};
