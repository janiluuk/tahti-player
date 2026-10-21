import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioShowView } from '@tahti-web/views/RadioShowView';
import { expect, within } from 'storybook/test';

import {
  radioShowMissingData,
  radioShowQuietData,
  radioShowRichData,
  RECORDING_ID,
  SHOW_ARTIST,
  SHOW_SLUG,
} from './_fixtures/radio-show';
import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof RadioShowView> = {
  title: 'Tahti/Channel/RadioShowView',
  component: RadioShowView,
  parameters: {
    layout: 'fullscreen',
    mockData: radioShowRichData,
    docs: {
      description: {
        component:
          "An artist's show page on Tahti Radio at `/radio/show/$channelSlug`: header with episode counts and, around a slot, the green room link; the track on air with what's up next (polled every 30 s); and the upcoming / past episode tabs with recordings.",
      },
    },
  },
  args: { channelSlug: SHOW_SLUG },
  decorators: [
    withMockAuth(null),
    withPageSurface(),
    withTahtiRouter(`/radio/show/${SHOW_SLUG}`),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OnAir: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const header = within(
      await canvas.findByTestId('radio-show-social-header'),
    );

    await step('header, counts and green room', async () => {
      await expect(header.getByText(SHOW_ARTIST)).toBeVisible();
      await expect(
        header.getByRole('link', {
          name: `@${SHOW_SLUG} · Show on Tahti Radio`,
        }),
      ).toHaveAttribute('href', `/u/${SHOW_SLUG}`);
      await expect(
        header.getByText('Upcoming').parentElement,
      ).toHaveTextContent('2Upcoming');
      await expect(
        header.getByText('Past episodes').parentElement,
      ).toHaveTextContent('1Past episodes');
      await expect(
        header.getByRole('link', { name: 'Open green room' }),
      ).toHaveAttribute('href', `/u/${SHOW_SLUG}/green-room`);
    });

    await step('now playing and up next', async () => {
      await expect(await canvas.findByText('Westend Terminus')).toBeVisible();
      await expect(canvas.getByText('On air')).toBeVisible();
      await expect(canvas.getByText('Up next')).toBeVisible();
      await expect(canvas.getByText('Night Bus Dub')).toBeVisible();
      await expect(canvas.getByText('Kaamos Bloom')).toBeVisible();
    });

    await step('upcoming and past episodes', async () => {
      const upcoming = await selectTab(canvas, 'Upcoming');
      await expect(upcoming).toHaveAttribute('aria-selected', 'true');
      await expect(
        canvas.getByText('Route 550 Live - Episode 3'),
      ).toBeVisible();
      await expect(canvas.getByText('Listener call-ins')).toBeVisible();
      await selectTab(canvas, 'Past episodes');
      await expect(
        canvas.getByRole('link', { name: 'Listen to the recording' }),
      ).toHaveAttribute('href', `/t/${RECORDING_ID}`);
    });
  },
};

export const NothingScheduled: Story = {
  parameters: { mockData: radioShowQuietData },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = within(
      await canvas.findByTestId('radio-show-social-header'),
    );
    await expect(header.queryByText('Upcoming')).toBeNull();
    await expect(
      header.queryByRole('link', { name: 'Open green room' }),
    ).toBeNull();
    await expect(canvas.queryByText('Now playing')).toBeNull();
    await selectTab(canvas, 'Upcoming');
    await expect(
      canvas.getByText('No upcoming slots booked right now.'),
    ).toBeVisible();
    await selectTab(canvas, 'Past episodes');
    await expect(canvas.getByText('Nothing has aired yet.')).toBeVisible();
  },
};

export const NotFound: Story = {
  parameters: { mockData: radioShowMissingData },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Show not found'),
    ).toBeVisible();
  },
};
