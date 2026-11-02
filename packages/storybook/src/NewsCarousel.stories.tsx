import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRightIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button, NewsCarousel } from '@tahti-player/ui';

const image = (seed: string) => `https://picsum.photos/seed/${seed}/800/400`;

const ITEMS = [
  {
    id: '1',
    title: 'DJWORX radio on Centreforce 883 2nd Nov 2026',
    source: 'DJWORX',
    sourceColor: '#ef4444',
    publishedAt: '2026-11-02T12:00:00.000Z',
    publishedLabel: '5 hours ago',
    imageUrl: image('news-centreforce'),
  },
  {
    id: '2',
    title: 'Best Of Today #Release #376 – 30 October 2026',
    source: 'EDM Lab',
    sourceColor: '#f59e0b',
    publishedAt: '2026-10-30T12:00:00.000Z',
    publishedLabel: 'Oct 30, 2026',
    imageUrl: image('news-edmlab'),
  },
  {
    id: '3',
    title: 'House Music Pioneer Cevin Fisher Has Died',
    source: '5 Magazine - Deep House',
    sourceColor: '#22c55e',
    publishedAt: '2026-10-30T09:00:00.000Z',
    publishedLabel: 'Oct 30, 2026',
    imageUrl: image('news-5mag'),
  },
  {
    id: '4',
    title: 'Creating Music Loops and Sound Effects That Work Together',
    source: 'DJWORX',
    sourceColor: '#ef4444',
    publishedAt: '2026-10-30T08:00:00.000Z',
    publishedLabel: 'Oct 30, 2026',
    imageUrl: image('news-djworx'),
  },
  {
    id: '5',
    title: 'A story without a picture falls back to a placeholder',
    source: 'CDM',
    sourceColor: '#8b5cf6',
    publishedLabel: 'Oct 29, 2026',
  },
];

const meta = {
  title: 'Media/NewsCarousel',
  component: NewsCarousel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Latest headlines from several RSS sources merged into one row of picture cards. Each card shows the preview picture, a coloured dot and the source name, how long ago it was published, and the title. **more News** and extra header actions (e.g. Sources) are slots; the arrows page through the row. Colours follow the theme tokens.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    items: ITEMS.map((item) => ({ ...item, onClick: fn() })),
    more: (
      <Button size="sm" variant="secondary" className="gap-1.5 rounded-full">
        more News
        <ArrowRightIcon size={14} aria-hidden />
      </Button>
    ),
  },
} satisfies Meta<typeof NewsCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Latest News' }),
    ).toBeVisible();
    const cards = canvas.getAllByTestId('news-carousel-item');
    await expect(cards).toHaveLength(5);
    await expect(cards[0]).toHaveTextContent('DJWORX');
    await expect(cards[0]).toHaveTextContent('5 hours ago');
    await userEvent.click(within(cards[1]).getByRole('button'));
    await expect(args.items[1].onClick).toHaveBeenCalled();
    await expect(
      canvas.getByRole('button', { name: 'Previous news' }),
    ).toBeDisabled();
  },
};

export const Phone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const Empty: Story = {
  args: { items: [], more: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('No news right now.'),
    ).toBeVisible();
  },
};
