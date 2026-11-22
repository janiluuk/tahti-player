import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoverEventsPanel } from '@tahti-web/components/discover/DiscoverEventsPanel';
import {
  DEFAULT_EVENTS_FILTERS,
  type EventsFilters,
} from '@tahti-web/components/discover/eventFilters';
import { useState } from 'react';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof DiscoverEventsPanel> = {
  title: 'Tahti/Discover/DiscoverEventsPanel',
  component: DiscoverEventsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Discover → Events (`/discover?tab=events`, `GET /api/v1/events?from&to`): public events from every host as banner cards (default artwork when there is no banner) with time in the event time zone and the venue. Date range presets (Upcoming, This week, This month, Next 3 months) and the Past toggle pick the fetch window (at most 92 days); city, venue and text search filter on the client; List / Calendar switches to the month grid with the same events. In the app the state lives in the URL (`range`, `past`, `city`, `venue`, `q`, `view`). Post event opens `/events/new` when signed in and the sign-in dialog when signed out.',
      },
    },
  },
  decorators: [withTahtiRouter('/discover?tab=events')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = within(await canvas.findByTestId('discover-events-list'));
    await expect(
      list.getByRole('link', {
        name: 'Aurora Drift b2b Northern Lights',
      }),
    ).toHaveAttribute('href', '/events/evt-mock-guest');
    await expect(list.getByText('Kaiku, Helsinki, Finland')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Post event' }),
    ).toHaveAttribute('href', '/events/new');
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', {
        name: 'Aurora Drift b2b Northern Lights',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Post event' }),
    ).toBeVisible();
    await expect(canvas.getByText('Sign in to post an event.')).toBeVisible();
  },
};

/** The tab opens with the next events (soonest first) above the filters;
 * a city, venue or text filter hides that row. */
export const NextEventsFirst: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = await canvas.findByTestId('discover-next-events');
    const filters = canvas.getByTestId('discover-events-filters');
    await expect(
      next.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const titles = within(next)
      .getAllByTestId('event-card-title')
      .map((node) => node.textContent);
    await expect(titles[0]).toBe('Album release show');
    await expect(titles[1]).toBe('Aurora Drift b2b Northern Lights');
  },
};

function FilteredPanel({ initial }: { initial: EventsFilters }) {
  const [filters, setFilters] = useState(initial);
  return <DiscoverEventsPanel filters={filters} onFiltersChange={setFilters} />;
}

export const FilteredByCity: Story = {
  decorators: [withMockAuth(null)],
  render: () => (
    <FilteredPanel initial={{ ...DEFAULT_EVENTS_FILTERS, city: 'Helsinki' }} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', {
        name: 'Aurora Drift b2b Northern Lights',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'City' }),
    ).toHaveTextContent('Helsinki');
    await expect(
      canvas.queryByText(/Saimaa Boathouse Studio/),
    ).not.toBeInTheDocument();
    await expect(canvas.queryByTestId('discover-next-events')).toBeNull();
  },
};

export const NoMatches: Story = {
  decorators: [withMockAuth(null)],
  render: () => (
    <FilteredPanel
      initial={{ ...DEFAULT_EVENTS_FILTERS, q: 'nothing like this' }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No events match these filters'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Clear filters' }),
    ).toBeVisible();
  },
};
