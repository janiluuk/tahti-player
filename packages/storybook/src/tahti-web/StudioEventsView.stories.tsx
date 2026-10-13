import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioEventsView } from '@tahti-web/views/studio/StudioEventsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { eventsAroundToday } from './_fixtures/studio';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectVisible, selectTab } from './_lib/play';

const meta: Meta<typeof StudioEventsView> = {
  title: 'Tahti/Studio/StudioEventsView',
  component: StudioEventsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Events: Upcoming and Past tabs listing each event with its date, place, description and ticket link, plus Edit and Remove per event and "Add event" in the header.',
      },
    },
    mockData: mockData({ myEvents: eventsAroundToday }),
  },
  decorators: [
    withTahtiRouter('/studio/events'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('link', { name: 'Add event' }),
    ).toHaveAttribute('href', '/studio/events/new');
    const first = await canvas.findByText('Album release show');
    // The tab panel fades in from opacity 0 on mount.
    await waitFor(() => expect(first).toBeVisible());
    await expectVisible(canvas.getByText('Late-night broadcast + open studio'));
    await expect(
      canvas.queryByText('Boathouse Sessions — audience recording'),
    ).toBeNull();
    await expect(
      canvas.getByRole('link', { name: 'Tickets / event link' }),
    ).toHaveAttribute(
      'href',
      'https://kuudeslinja.fi/events/midnight-cartography',
    );
    const edits = canvas.getAllByRole('link', { name: 'Edit' });
    await expect(edits).toHaveLength(2);
    await expect(edits[0]).toHaveAttribute(
      'href',
      '/studio/events/evt-mock-1/edit',
    );
  },
};

export const Past: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Album release show');
    await selectTab(canvas, 'Past');
    await expectVisible(await canvas.findByText('Past events'));
    await expectVisible(
      canvas.getByText('Boathouse Sessions — audience recording'),
    );
    await expectVisible(canvas.getByText('Loop Diary release cypher'));
    await expect(
      canvas.getAllByRole('button', { name: 'Remove' }),
    ).toHaveLength(2);
  },
};

export const RemoveEvent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Album release show');
    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Remove' })[0]!,
    );
    await waitFor(() =>
      expect(canvas.queryByText('Album release show')).toBeNull(),
    );
    await waitFor(() =>
      expect(
        canvas.getByText('Late-night broadcast + open studio'),
      ).toBeVisible(),
    );
  },
};

export const Empty: Story = {
  parameters: { mockData: mockData({ myEvents: () => [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const empty = await canvas.findByText('No events listed yet');
    // The tab panel fades in from opacity 0 on mount.
    await waitFor(() => expect(empty).toBeVisible());
  },
};
