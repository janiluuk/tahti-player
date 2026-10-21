import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoverView } from '@tahti-web/views/DiscoverView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof DiscoverView> = {
  title: 'Tahti/Discover/DiscoverView',
  component: DiscoverView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Discover page (`/discover`) with Discover / Artists / Venues tabs (`?tab=`). Discover has the genre / type / unheard filters, news feeds and the widget columns (with "add widget"); Artists is the directory browser; Venues lists verified venues with a "Register a venue" link.',
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

    await step('switch to Artists, Venues and back', async () => {
      await selectTab(canvas, /Artists/);
      await expect(canvas.queryByTestId('discover-filters')).toBeNull();
      await selectTab(canvas, /Venues/);
      await expect(
        await canvas.findByRole('link', { name: 'Register a venue' }),
      ).toBeVisible();
      await expect(await canvas.findByText('Kuudes Linja')).toBeVisible();
      await selectTab(canvas, /Discover/);
      await expect(await canvas.findByTestId('discover-filters')).toBeVisible();
    });
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
};
