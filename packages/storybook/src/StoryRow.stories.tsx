import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { StoryCard, StoryRow } from '@tahti-player/ui';

const STORIES = [
  [
    'shared news',
    '1 day ago',
    'My journey: the story behind the mixes',
    'DJ Aurora',
  ],
  [
    'shared a story',
    '1 day ago',
    'Hi, I make the flutes you hear here',
    'Resonant Crafts',
  ],
  [
    'posted an announcement',
    '3 days ago',
    'Thank you - 15000+ listens',
    'Kasari',
  ],
  [
    'released a track',
    '14 hours ago',
    'New EP out on Friday',
    'Northern Lights',
  ],
] as const;

const meta = {
  title: 'Layout/StoryRow',
  component: StoryRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Horizontal strip of `StoryCard`s with round Previous / Next buttons. Most of one card on phones, two from md, three from xl; snaps per card.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    title: 'Community stories',
    children: STORIES.map(([kind, date, title, author], index) => (
      <StoryCard
        key={title}
        imageSrc={`https://picsum.photos/seed/tahti-story-${index}/960/540`}
        kind={kind}
        date={date}
        title={title}
        excerpt="A short excerpt of the post that runs to a couple of lines in the card."
        authorName={author}
      />
    )),
  },
} satisfies Meta<typeof StoryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At 1280px three cards fit; Previous starts disabled, Next is enabled. */
export const Desktop: Story = {
  decorators: [
    (Story) => (
      <div className="w-[1280px] max-w-full">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Previous' }),
    ).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeEnabled();
  },
};

export const Phone: Story = {
  decorators: [
    (Story) => (
      <div className="w-[390px] max-w-full">
        <Story />
      </div>
    ),
  ],
};
