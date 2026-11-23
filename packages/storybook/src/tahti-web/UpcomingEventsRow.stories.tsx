import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UpcomingEvent } from '@tahti-web/api/upcoming-events';
import {
  DiscoverNextEvents,
  UpcomingEventsStrip,
} from '@tahti-web/components/discover/UpcomingEventsRow';
import { WidgetCard } from '@tahti-web/components/discover/WidgetCard';
import { expect, userEvent, within } from 'storybook/test';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import { withTahtiRouter } from './_lib/decorators';

const DEFAULT_ARTWORK = '/artwork-presets/artwork-02.webp';

const meta: Meta<typeof UpcomingEventsStrip> = {
  title: 'Tahti/Discover/UpcomingEventsRow',
  component: UpcomingEventsStrip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Upcoming events, soonest first: the Discover widget shows one poster at a time with an ambient glow from its image (browse with the arrow buttons, a drag or swipe, or the arrow keys; both ends wrap), the Next events row shows `Card`s. Each shows banner, title, 24-hour start time in the event time zone, host and venue + city, with icons, from `fetchUpcomingEvents` (`GET /api/v1/events/upcoming`). An event without a banner falls back to the host avatar, then the default artwork (`MediaArtwork` seeded with the event id). Used as the `upcoming-events` Discover widget (inside `WidgetCard`, with See all events) and as the Next events row at the top of Discover → Events.',
      },
    },
  },
  decorators: [
    (Story) => (
      <MediaArtworkDefaultProvider value={() => DEFAULT_ARTWORK}>
        <Story />
      </MediaArtworkDefaultProvider>
    ),
    withTahtiRouter('/discover'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function event(
  id: string,
  title: string,
  days: number,
  patch: Partial<UpcomingEvent> = {},
): UpcomingEvent {
  return {
    id,
    title,
    description: null,
    place: 'Kuudes Linja',
    location: 'Helsinki, Finland',
    eventUrl: null,
    startAt: new Date(Date.now() + days * 86_400_000).toISOString(),
    timezone: 'Europe/Helsinki',
    gallery: [],
    artistDisplayName: 'Northern Lights',
    artistUsername: 'northern-lights',
    channelSlug: 'northern-lights',
    avatarUrl: null,
    ...patch,
  };
}

const events: UpcomingEvent[] = [
  event('evt-story-1', 'Album release show', 2, {
    imageUrl: '/artwork-presets/artwork-05.webp',
    venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
  }),
  event('evt-story-2', 'Boathouse Sessions - audience recording', 6, {
    place: 'Saimaa Boathouse Studio',
    location: 'Lappeenranta, Finland',
  }),
  event('evt-story-3', 'Loop Diary release cypher', 10, {
    imageUrl: '/artwork-presets/artwork-16.webp',
    place: 'Vanha Kutomo',
    location: 'Turku, Finland',
    artistDisplayName: 'Kaiku Collective',
  }),
];

export const DiscoverWidget: Story = {
  args: { events },
  render: (args) => (
    <div className="max-w-md">
      <WidgetCard
        id="upcoming-events"
        title="Upcoming events"
        loading={false}
        items={[]}
        events={args.events}
        emptyMessage="No upcoming events yet."
        canMoveUp={false}
        canMoveDown
        onMove={() => {}}
        onRemove={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const carousel = canvas.getByTestId('upcoming-events');
    const title = () =>
      within(carousel).getByTestId('event-card-title').textContent;
    await expect(title()).toBe('Album release show');
    await expect(within(carousel).getByText('Kaiku, Helsinki')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Previous event' }),
    );
    await expect(title()).toBe('Loop Diary release cypher');
    await userEvent.click(canvas.getByRole('button', { name: 'Next event' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next event' }));
    await expect(title()).toBe('Boathouse Sessions - audience recording');
    await expect(carousel.querySelector('img')?.getAttribute('src')).toBe(
      DEFAULT_ARTWORK,
    );
    await expect(
      canvas.getByRole('link', { name: 'See all events' }),
    ).toHaveAttribute('href', '/discover?tab=events');
  },
};

export const EmptyWidget: Story = {
  args: { events: [] },
  render: () => (
    <div className="max-w-md">
      <WidgetCard
        id="upcoming-events"
        title="Upcoming events"
        loading={false}
        items={[]}
        events={[]}
        emptyMessage="No upcoming events yet."
        canMoveUp={false}
        canMoveDown={false}
        onMove={() => {}}
        onRemove={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No upcoming events yet.')).toBeVisible();
    await expect(canvas.queryByTestId('upcoming-events')).toBeNull();
  },
};

/** The top of Discover → Events, from the mock upcoming list. */
export const NextEventsRow: Story = {
  args: { events: [] },
  decorators: [withTahtiRouter('/discover?tab=events')],
  render: () => <DiscoverNextEvents />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = await canvas.findByTestId('discover-next-events');
    await expect(within(row).getByText('Next events')).toBeVisible();
    await expect(
      within(row).getByText('Aurora Drift b2b Northern Lights'),
    ).toBeVisible();
  },
};
