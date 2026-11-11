import type { Meta, StoryObj } from '@storybook/react-vite';
import { mockEvents } from '@tahti-web/api/events';
import { EventCard } from '@tahti-web/components/events/EventCard';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const tagged = mockEvents.find((event) => event.id === 'evt-mock-2')!;
const cancelled = mockEvents.find((event) => event.status === 'CANCELLED')!;
const draft = mockEvents.find((event) => event.status === 'DRAFT')!;

const meta: Meta<typeof EventCard> = {
  title: 'Tahti/Events/EventCard',
  component: EventCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One artist event: cover (default artwork when none), time window, place, accepted tags and ticket link. Used by the Feed calendar, the channel events block, the Studio event page, invites and the preview dialog.',
      },
    },
  },
  decorators: [withTahtiRouter('/discover')],
  args: {
    event: tagged,
    host: { displayName: 'Demo Artist', channelSlug: 'demo' },
    linkToPage: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PublishedWithTags: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('link', { name: tagged.title }),
    ).toHaveAttribute('href', `/events/${tagged.id}`);
    await expect(canvas.getByText('Northern Signals')).toBeVisible();
    await expect(canvas.queryByText('Yaniho')).not.toBeInTheDocument();
    await expect(canvas.getByText('Tickets')).toBeVisible();
  },
};

export const PendingTagsShown: Story = {
  args: { showPendingTags: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Pending')).toBeVisible();
  },
};

export const Cancelled: Story = {
  args: { event: cancelled },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Cancelled')).toBeVisible();
  },
};

export const FansOnlyAtVenue: Story = {
  args: {
    event: {
      ...tagged,
      visibility: 'FANS',
      timezone: 'Pacific/Auckland',
      venue: {
        id: 'venue-1',
        slug: 'kuudes-linja',
        name: 'Kuudes Linja',
        city: 'Helsinki',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Fans only')).toBeVisible();
    await expect(canvas.getByText(/Kuudes Linja/)).toBeVisible();
    await expect(canvas.getByTestId('event-local-time')).toHaveTextContent(
      'Pacific/Auckland',
    );
  },
};

export const Draft: Story = {
  args: { event: draft },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Draft')).toBeVisible();
    await expect(
      canvas.queryByRole('link', { name: draft.title }),
    ).not.toBeInTheDocument();
  },
};
