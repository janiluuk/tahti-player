import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeedStoryDialog } from '@tahti-web/components/FeedStoryDialog';
import { expect } from 'storybook/test';

import { Button } from '@tahti-player/ui';

import { withTahtiRouter } from './_lib/decorators';
import { withinBody } from './_lib/play';

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

const meta: Meta<typeof FeedStoryDialog> = {
  title: 'Tahti/Feed/FeedStoryDialog',
  component: FeedStoryDialog,
  decorators: [withTahtiRouter('/listen/feed')],
  parameters: {
    docs: {
      description: {
        component:
          'The one reader for every feed item: artist posts, tracks, releases, RSS articles, Tahti news and community stories. Wide image, kind badge with a relative date, title, author, the full text, and actions.',
      },
    },
  },
  args: {
    onClose: () => {},
    story: {
      id: 'post-1',
      kind: 'Post',
      title: 'Thursday show moved an hour later',
      publishedAt: hoursAgo(5),
      author: { name: 'Midnight Cartography', username: 'midnight' },
      imageUrl: '/artwork-presets/artwork-01.webp',
      paragraphs: [
        'Starting at 01:00 EEST this week, recording a special Ring Rail segment first.',
        'The archive keeps playing on the channel until then, and the chat opens fifteen minutes before we go on air.',
        'See you after midnight.',
      ],
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const ArtistPost: Story = {
  play: async ({ canvasElement }) => {
    const article =
      await withinBody(canvasElement).findByTestId('news-article');
    await expect(article).toHaveTextContent('See you after midnight.');
    await expect(article).toHaveTextContent('5 hours ago');
  },
};

export const NewsArticle: Story = {
  args: {
    story: {
      id: 'news-1',
      kind: 'News',
      title: 'Tahti ry opens applications for the winter grant round',
      publishedAt: hoursAgo(24 * 9),
      source: 'Tahti News',
      imageUrl: '/news-opening.svg',
      paragraphs: [
        'The member-voted grant pool is open for the winter round.',
        'Applications close at the end of November.',
      ],
      link: 'https://tahti.live/news/winter-grants',
    },
  },
};

export const TrackWithPlay: Story = {
  args: {
    story: {
      id: 'track-1',
      kind: 'New track',
      title: 'Moonlight Drive',
      publishedAt: hoursAgo(30),
      author: { name: 'DJ Moonlight', username: 'moon' },
      imageUrl: '/artwork-presets/artwork-02.webp',
      paragraphs: ['DJ Moonlight shared a new track, “Moonlight Drive”.'],
    },
    actions: <Button>Play</Button>,
  },
};

export const HeadlineOnly: Story = {
  args: {
    story: {
      id: 'news-2',
      kind: 'News',
      title: 'Headline-only feed item',
      publishedAt: hoursAgo(2),
      source: 'Mixmag',
      paragraphs: [],
      link: 'https://mixmag.net/read/headline',
    },
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
