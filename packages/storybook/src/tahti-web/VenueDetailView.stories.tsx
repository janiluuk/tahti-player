import type { Meta, StoryObj } from '@storybook/react-vite';
import { VenueDetailView } from '@tahti-web/views/VenueDetailView';
import { expect, within } from 'storybook/test';

import { VENUE_SLUG, venueBareData, venueRichData } from './_fixtures/discover';
import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof VenueDetailView> = {
  title: 'Tahti/Discover/VenueDetailView',
  component: VenueDetailView,
  parameters: {
    layout: 'padded',
    mockData: venueRichData,
    docs: {
      description: {
        component:
          'A verified venue at `/venues/$slug`: header (photo, place, capacity, website), address, upcoming shows with the calendar feed, and "Recorded here" - public tracks whose artist linked this venue.',
      },
    },
  },
  args: { slug: VENUE_SLUG },
  decorators: [withTahtiRouter(`/venues/${VENUE_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { level: 1, name: 'Kuudes Linja' });

    await step('header links and back link', async () => {
      await expect(
        canvas.getByRole('link', { name: /Venue website/ }),
      ).toHaveAttribute('href', 'https://tahti.live');
      await expect(
        canvas.getByRole('link', { name: /All venues/ }),
      ).toHaveAttribute('href', '/discover?tab=venues');
    });

    await step('upcoming shows section', async () => {
      const shows = within(
        canvas.getByRole('region', { name: 'Upcoming shows' }),
      );
      await expect(
        shows.getByText('Northern Lights - Polar Static live'),
      ).toBeVisible();
      await expect(
        shows.getByRole('link', { name: /Add to calendar/ }),
      ).toHaveAttribute('download');
    });

    await step('Recorded here lists tracks linked to the venue', async () => {
      const recorded = within(
        canvas.getByRole('region', { name: 'Recorded here' }),
      );
      await expect(
        recorded.getByRole('link', { name: /Midnight Broadcast/ }),
      ).toHaveAttribute('href', '/t/northern-lights-archive-2');
      await expect(recorded.getAllByRole('link')).toHaveLength(2);
    });
  },
};

export const NoShowsOrRecordings: Story = {
  parameters: { mockData: venueBareData },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No shows booked here yet.'),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('region', { name: 'Recorded here' }),
    ).toBeNull();
  },
};

export const NotFound: Story = {
  args: { slug: 'no-such-venue' },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Venue not found'),
    ).toBeVisible();
  },
};
