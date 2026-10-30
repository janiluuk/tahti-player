import type { Meta, StoryObj } from '@storybook/react-vite';

import { StoryCard } from '@tahti-player/ui';

const meta = {
  title: 'Layout/StoryCard',
  component: StoryCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Editorial card for posts and feed items: 16:9 image (or a `media` slot such as artwork with play), muted meta line, bold title, 3-line excerpt and author. No frame. Used by Listen → Feed and the Discover Community stories widget.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    imageSrc: 'https://picsum.photos/seed/tahti-flute/960/540',
    meta: 'News · 1 day ago',
    title: 'Hi, I make the flutes you hear here',
    excerpt:
      "I make native-style flutes by hand and record music with them. A short hello and what you'll find on this page.",
    authorName: 'Resonant Crafts',
  },
} satisfies Meta<typeof StoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {};

/** No image: a gradient with the author's initial, never an empty box. */
export const NoImage: Story = { args: { imageSrc: null } };

/** Long title and excerpt clamp to three lines each. */
export const LongText: Story = {
  args: {
    meta: 'Announcement · Oct 27, 2026',
    title:
      'Many thanks for your time and attention - 15000+ listens, 2000+ downloads, and a few words about what comes next for the show',
    excerpt:
      'Dear people of online sonic adventures, thanks for your support here. I hope you are enjoying every drop of the mixes on this page, because there is a lot more coming and I want to tell you all about it in this post.',
    authorName: 'Beatinspector',
  },
};
