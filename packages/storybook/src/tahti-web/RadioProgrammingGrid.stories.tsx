import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PublicRadioSlot } from '@tahti-web/api/shows';
import { RadioProgrammingGrid } from '@tahti-web/components/channel-view/RadioProgrammingGrid';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const HOUR = 3_600_000;

/** Noon today, so every slot below stays on the day it is meant for
 * whatever time the story runs. */
const NOON = (() => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date.getTime();
})();

function slot(
  id: string,
  startOffsetH: number,
  hours: number,
  patch: Partial<PublicRadioSlot> & { artist: PublicRadioSlot['artist'] },
): PublicRadioSlot {
  return {
    id,
    startAt: new Date(NOON + startOffsetH * HOUR).toISOString(),
    endAt: new Date(NOON + (startOffsetH + hours) * HOUR).toISOString(),
    note: null,
    showType: 'LIVE_SET',
    coverUrl: null,
    ...patch,
  };
}

const WEEK: PublicRadioSlot[] = [
  slot('on-air', -0.5, 1, {
    note: 'Route 550 Live',
    artist: {
      displayName: 'Midnight Cartography',
      username: 'midnight-cartography',
      avatarUrl: null,
      channelSlug: 'midnight-cartography',
    },
  }),
  slot('tonight', 8, 2, {
    showType: 'TALK',
    artist: {
      displayName: 'Saimaa Sessions',
      username: 'saimaa-sessions',
      avatarUrl: null,
      channelSlug: null,
    },
  }),
  slot('tomorrow', 32, 1, {
    note: 'Kaiku Cypher Sessions',
    artist: {
      displayName: 'Kaiku Collective',
      username: 'kaiku-collective',
      avatarUrl: null,
      channelSlug: 'kaiku-collective',
    },
  }),
];

const meta: Meta<typeof RadioProgrammingGrid> = {
  title: 'Tahti/Channel/RadioProgrammingGrid',
  component: RadioProgrammingGrid,
  parameters: {
    layout: 'padded',
    mockData: mockData({ radioSlots: () => WEEK }),
    docs: {
      description: {
        component:
          "The week ahead of booked live shows on Tahti Radio, in the radio channel page's Programming block. Grouped by day; the slot on air now gets a badge.",
      },
    },
  },
  args: { nowMs: NOON },
  decorators: [withTahtiRouter('/channel/tahti-radio')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Week: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const today = await canvas.findByRole('region', { name: 'Today' });
    const [onAir, tonight] = within(today).getAllByRole('listitem');
    await expect(onAir).toHaveTextContent('Route 550 Live');
    await expect(within(onAir!).getByText('On air')).toBeVisible();
    await expect(
      within(onAir!).getByRole('link', { name: 'Midnight Cartography' }),
    ).toHaveAttribute('href', '/radio/show/midnight-cartography');
    await expect(tonight).toHaveTextContent('Saimaa Sessions');
    await expect(tonight).toHaveTextContent('Talk show');
    await expect(within(tonight!).queryByRole('link')).toBeNull();
    await expect(within(tonight!).queryByText('On air')).toBeNull();
    const regions = canvas.getAllByRole('region');
    await expect(regions).toHaveLength(2);
    await expect(regions[1]).toHaveTextContent('Kaiku Cypher Sessions');
  },
};

export const NothingBooked: Story = {
  parameters: { mockData: mockData({ radioSlots: () => [] }) },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        'No live shows booked in the next 7 days.',
      ),
    ).toBeVisible();
  },
};
