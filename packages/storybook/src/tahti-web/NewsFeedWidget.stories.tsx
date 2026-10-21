import type { Meta, StoryObj } from '@storybook/react-vite';
import { NewsFeedWidget } from '@tahti-web/components/NewsFeedWidget';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof NewsFeedWidget> = {
  title: 'Tahti/Widgets/NewsFeedWidget',
  component: NewsFeedWidget,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An RSS news add-on on Listen / Discover. Clicking an article opens it in a reader dialog with the full text, "Read on <site>" and Close, instead of leaving Tahti for a new tab.',
      },
    },
  },
  args: {
    instance: {
      id: 'story-news',
      typeId: 'news',
      input: 'https://mixmag.net/rss.xml',
      label: 'Mixmag',
      addedAt: '2026-10-21T00:00:00.000Z',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReadArticle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [card] = await canvas.findAllByTestId('article-card');
    await userEvent.click(card!);
    const body = withinBody(canvasElement);
    const article = await body.findByTestId('news-article');
    await expect(article).toBeVisible();
    await expect(
      within(article).getByRole('link', { name: /Read on tahti\.live/ }),
    ).toHaveAttribute('target', '_blank');
    await userEvent.click(within(article).getByTestId('dialog-close'));
    await waitFor(() => expect(body.queryByTestId('news-article')).toBeNull());
  },
};
