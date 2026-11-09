import type { Meta, StoryObj } from '@storybook/react-vite';
import { EventView } from '@tahti-web/views/EventView';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof EventView> = {
  title: 'Tahti/Events/EventView',
  component: EventView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public event page (`/events/:eventId`, `GET /api/v1/events/:id`): the card, full description, Add to Google Calendar, the artist .ics feed and a share link. Drafts are not found.',
      },
    },
  },
  args: { eventId: 'evt-mock-guest' },
  decorators: [withTahtiRouter('/events/evt-mock-guest')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('event-page')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Add to Google Calendar/ }),
    ).toBeVisible();
  },
};

export const NotFound: Story = {
  args: { eventId: 'evt-mock-7' },
  decorators: [withTahtiRouter('/events/evt-mock-7')],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Event not found'),
    ).toBeVisible();
  },
};
