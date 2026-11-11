import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoverView } from '@tahti-web/views/DiscoverView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { selectTab } from './_lib/play';

const meta: Meta<typeof DiscoverView> = {
  title: 'Tahti/Discover/DiscoverView',
  component: DiscoverView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Discover page (`/discover`) with Discover / Feed / Parties / Artists / Groups / Venues tabs (`?tab=`). Parties lists live and upcoming public listening parties (`GET /api/v1/listening-parties`); the Discover tab shows the first three as a row with a See all link. Discover has the genre / type / unheard filters, news feeds and the widget columns (with "add widget"); Artists is the directory browser; Groups lists public artist collectives (same `GroupsDirectory` as `/groups`); Venues lists verified venues with a "Register a venue" link.',
      },
    },
  },
  decorators: [withMockAuth(MOCK_USERS.listener), withTahtiRouter('/discover')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const filters = within(await canvas.findByTestId('discover-filters'));

    await step('genre filter chips open and close', async () => {
      const genres = filters.getByRole('button', { name: /Genres/ });
      await userEvent.click(genres);
      await expect(genres).toHaveAttribute('aria-expanded', 'true');
      await userEvent.click(genres);
      await expect(genres).toHaveAttribute('aria-expanded', 'false');
    });

    await step('switch to Artists, Groups, Venues and back', async () => {
      await selectTab(canvas, /Artists/);
      await expect(canvas.queryByTestId('discover-filters')).toBeNull();
      await selectTab(canvas, /Groups/);
      await waitFor(() =>
        expect(canvas.getByTestId('discover-groups')).toBeVisible(),
      );
      await waitFor(() =>
        expect(canvas.getByRole('link', { name: 'Ambient Lab' })).toBeVisible(),
      );
      await selectTab(canvas, /Venues/);
      await waitFor(() =>
        expect(
          canvas.getByRole('link', { name: 'Register a venue' }),
        ).toBeVisible(),
      );
      await waitFor(() =>
        expect(canvas.getByText('Kuudes Linja')).toBeVisible(),
      );
      await selectTab(canvas, /Discover/);
      await waitFor(() =>
        expect(canvas.getByTestId('discover-filters')).toBeVisible(),
      );
    });
  },
};

export const GroupsTab: Story = {
  decorators: [withTahtiRouter('/discover?tab=groups')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId('discover-groups'),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('link', { name: 'Trance Mixes and DJ Sets' }),
    ).toHaveAttribute('href', '/groups/trance-mixes');
    await expect(
      canvas.getByRole('link', { name: 'Vinyl Crate Diggers' }),
    ).toBeVisible();
  },
};

export const PartiesTab: Story = {
  decorators: [withTahtiRouter('/discover?tab=parties')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = within(await canvas.findByTestId('discover-parties'));
    const rows = await panel.findAllByTestId('listening-party-row');
    await expect(rows.length).toBeGreaterThan(1);
    await expect(
      within(rows[0]).getByText('Listening party · live now'),
    ).toBeVisible();
    await expect(
      within(rows[0]).getByRole('link', {
        name: /Open the listening party for/,
      }),
    ).toHaveAttribute('href', expect.stringMatching(/^\/party\//));
  },
};

export const PartiesEmpty: Story = {
  decorators: [withTahtiRouter('/discover?tab=parties')],
  parameters: { mockData: mockData({ publicListeningParties: () => [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No listening parties right now'),
    ).toBeVisible();
  },
};

export const PartiesRowOnDiscover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = within(await canvas.findByTestId('discover-parties-row'));
    await expect(row.getAllByTestId('listening-party-row').length).toBeLessThan(
      4,
    );
    const seeAll = canvas
      .getAllByRole('link', { name: /See all/ })
      .map((link) => link.getAttribute('href'));
    await expect(seeAll).toContain('/discover?tab=parties');
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
};

/** Feed tab: the community stories row on top of the followed-artists
 * feed (moved here from Listen). */
export const FeedTab: Story = {
  decorators: [withTahtiRouter('/discover?tab=feed')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId('discover-feed'),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('heading', { name: 'Community stories' }),
    ).toBeVisible();
  },
};
