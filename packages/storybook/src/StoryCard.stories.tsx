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
          'Editorial card for posts and feed items: 16:9 image (or a `media` slot such as artwork with play), activity-type pill + humanized date, bold title, 3-line excerpt and author. No frame. Used by Listen → Feed and the Discover Community stories widget.',
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
    kind: 'shared news',
    date: '1 day ago',
    title: 'Hi, I make the flutes you hear here',
    excerpt:
      "I make native-style flutes by hand and record music with them. A short hello and what you'll find on this page.",
    authorName: 'Resonant Crafts',
  },
} satisfies Meta<typeof StoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {};

/** No image and no avatar: a gradient with the author's initial, never an
 * empty box. */
export const NoImage: Story = { args: { imageSrc: null } };

/** No image but an avatar: the avatar, blurred, fills the frame with the
 * round avatar on top. */
export const NoImageWithAvatar: Story = {
  args: {
    imageSrc: null,
    authorAvatarSrc: 'https://picsum.photos/seed/tahti-avatar/240/240',
  },
};

/** Long title and excerpt clamp to three lines each. */
export const LongText: Story = {
  args: {
    kind: 'posted an announcement',
    date: '3 days ago',
    title:
      'Many thanks for your time and attention - 15000+ listens, 2000+ downloads, and a few words about what comes next for the show',
    excerpt:
      'Dear people of online sonic adventures, thanks for your support here. I hope you are enjoying every drop of the mixes on this page, because there is a lot more coming and I want to tell you all about it in this post.',
    authorName: 'Beatinspector',
  },
};

export const ReleasedATrack: Story = {
  args: {
    kind: 'released a track',
    date: '14 hours ago',
    title: 'Polar Static',
    excerpt: undefined,
    authorName: 'Northern Lights',
  },
};
