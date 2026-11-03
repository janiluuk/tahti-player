import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { ArticleCard, StoryCard } from '@tahti-player/ui';

const meta = {
  title: 'Layout/StoryCard',
  component: StoryCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The one card for platform news, artist posts, community stories, feed items and RSS articles: the image fills a 16:9 frame and a dark gradient layer carries the kind pill, date (clock icon), title, a one-line excerpt and the author on top of it. `ArticleCard` (NewsWidget) renders through it, so every news and story row looks the same.',
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

/** The same design across every source: Tahti news, an artist post, a
 * community story and an RSS article. */
export const UnifiedSources: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-none">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
      <ArticleCard
        className="w-auto sm:w-auto"
        item={{
          id: 'news',
          kind: 'News',
          title: 'We are now open!',
          teaser: 'tahti.live final release candidate is up.',
          imageUrl: '/news-opening.svg',
          publishedAt: '2026-11-01T10:00:00.000Z',
          publishedLabel: '2 days ago',
          onClick: () => undefined,
        }}
      />
      <StoryCard
        imageSrc="https://picsum.photos/seed/tahti-set/960/540"
        kind="Story"
        date="3 hours ago"
        title="Nightriders vol. 47 is up"
        excerpt="A warm-up set of poppy club music."
        authorName="Yaniho"
      />
      <StoryCard
        imageSrc={null}
        kind="Announcement"
        date="5.10.2026"
        title="Thank you - 15000+ listens"
        authorName="DJ Moonlight"
      />
      <ArticleCard
        className="w-auto sm:w-auto"
        item={{
          id: 'rss',
          kind: 'Resident Advisor',
          title: 'The clubs shaping Helsinki nights this winter',
          imageUrl: 'https://picsum.photos/seed/tahti-rss/960/540',
          publishedAt: '2026-10-28T08:00:00.000Z',
          publishedLabel: '6 days ago',
          onClick: () => undefined,
        }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByTestId(/^(story|article)-card$/)).toHaveLength(
      4,
    );
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    await expect(canvasElement.querySelectorAll('time')).toHaveLength(4);
  },
};
