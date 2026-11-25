import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioRevenueView } from '@tahti-web/views/studio/StudioRevenueView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioRevenueView> = {
  title: 'Tahti/Studio/StudioRevenueView',
  component: StudioRevenueView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Audience (`/studio/audience`): earnings, fan subscription orders and grants. `?tab=tiers` edits membership tiers and `?tab=store` the channel store.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/audience'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Earnings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Earnings', level: 1 }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: 'Past grants' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Store' })).toBeVisible();
  },
};

export const Tiers: Story = {
  decorators: [withTahtiRouter('/studio/audience?tab=tiers')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Memberships', level: 1 }),
    ).toBeVisible();
  },
};
