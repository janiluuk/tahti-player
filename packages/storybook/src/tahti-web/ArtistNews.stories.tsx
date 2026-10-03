import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistNews } from '@tahti-web/components/artist-view';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ArtistNews> = {
  title: 'Tahti/Artist/ArtistNews',
  component: ArtistNews,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "News block on an artist page: the channel's pinned announcements, then items from the artist's own RSS/Atom news feed.",
      },
    },
  },
  args: {
    username: 'northern-lights',
    news: [
      {
        id: 'news-1',
        body: 'Polar Static vinyl is back in stock - limited to 200 copies.',
        createdAt: '2026-09-29T09:00:00.000Z',
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PinnedAndFeed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/vinyl is back in stock/)).toBeVisible();
    await expect(
      await canvas.findByRole('link', { name: /New EP out on Friday/ }),
    ).toBeVisible();
  },
};

export const FeedOnly: Story = {
  args: { news: [] },
};
