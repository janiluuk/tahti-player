import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioEventView } from '@tahti-web/views/studio/StudioEventView';
import { expect, within } from 'storybook/test';

import { eventsAroundToday } from './_fixtures/studio';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof StudioEventView> = {
  title: 'Tahti/Studio/StudioEventView',
  component: StudioEventView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Events → one event (`/studio/events/:id`), read-only: start, place, description and ticket link. The pencil opens the form at `/studio/events/:id/edit`; the Broadcast agenda links here.',
      },
    },
    mockData: mockData({ myEvents: eventsAroundToday }),
  },
  args: { eventId: 'evt-mock-1' },
  decorators: [
    withTahtiRouter('/studio/events/evt-mock-1'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Album release show' }),
    ).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Edit Album release show' }),
    ).toHaveAttribute('href', '/studio/events/evt-mock-1/edit');
  },
};

export const NotFound: Story = {
  args: { eventId: 'missing' },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('That event could not be found'),
    ).toBeInTheDocument();
  },
};
