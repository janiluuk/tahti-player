import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioStatsDetailView } from '@tahti-web/views/studio/StudioStatsDetailView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof StudioStatsDetailView> = {
  title: 'Tahti/Studio/StudioStatsDetailView',
  component: StudioStatsDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Stats → Insights (`/studio/stats/detail`, also `/studio/insights`): plays, downloads and smart-link clicks for today, 7 days, 30 days or all time, a per-day chart (a calendar heatmap past 30 days) and download countries.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/stats/detail'),
    withMockAuth(MOCK_USERS.artist),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThirtyDays: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Insights' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: /Stats/ })).toHaveAttribute(
      'href',
      '/studio/stats',
    );
    const ranges = canvas.getByRole('radiogroup', { name: 'Plays time range' });
    await expect(
      within(ranges).getByRole('radio', { name: '30 days' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expectVisible(await canvas.findByText('Plays — 30 days'));
    await expect(canvas.getByText(/downloads/)).toBeVisible();
    await expect(canvas.getByText('Download countries')).toBeVisible();
    await expect(canvas.getByText(/Finland/)).toBeVisible();
  },
};

export const AllTimeHeatmap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Plays — 30 days');
    await userEvent.click(canvas.getByRole('radio', { name: 'All time' }));
    await expectVisible(await canvas.findByText('Plays — all time'));
    // Past 30 days the bar chart gives way to the calendar heatmap.
    await expectVisible(await canvas.findByText('Less'));
    await expect(canvas.getByText('More')).toBeVisible();
  },
};
