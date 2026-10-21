import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistReposts } from '@tahti-web/components/artist-view/ArtistReposts';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ArtistReposts> = {
  title: 'Tahti/Artist/ArtistReposts',
  component: ArtistReposts,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Tracks the artist reposted, on their Stage tab. Each row links to the track page and to the original artist's profile.",
      },
    },
  },
  args: { username: 'northern-lights' },
  decorators: [withTahtiRouter('/u/northern-lights')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole('region', { name: 'Reposts' });
    await expect(
      within(section).getByRole('link', { name: 'Borrowed Light' }),
    ).toHaveAttribute('href', '/t/mock-repost-1');
  },
};
