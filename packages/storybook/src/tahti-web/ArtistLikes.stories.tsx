import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistLikes } from '@tahti-web/components/artist-view/ArtistLikes';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { expect, waitFor, within } from 'storybook/test';

import {
  ARTIST_USERNAME,
  artistLikesData,
  artistLikesHiddenData,
} from './_fixtures/artist';
import { clickRowPlay } from './_fixtures/track-table';
import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ArtistLikes> = {
  title: 'Tahti/Artist/ArtistLikes',
  component: ArtistLikes,
  parameters: {
    layout: 'padded',
    mockData: artistLikesData,
    docs: {
      description: {
        component:
          'Public "Liked tracks" list on an artist\'s Stage tab. Only shows when the artist turned `showLikes` on; gated tracks without an audio URL are left out.',
      },
    },
  },
  args: { username: ARTIST_USERNAME },
  decorators: [withTahtiRouter(`/u/${ARTIST_USERNAME}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowLikes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole('region', {
      name: 'Liked tracks',
    });
    await expect(within(section).getByText('After Hours Drive')).toBeVisible();
    await expect(
      within(section).queryByText('Gated Subscriber Cut'),
    ).toBeNull();
    await clickRowPlay(section, 'Moonlight Drive');
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).toBe(
        'sound:dj-moonlight-archive-2',
      ),
    );
  },
};

export const LikesHidden: Story = {
  parameters: { mockData: artistLikesHiddenData },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole('region', { name: 'Liked tracks' }),
      ).toBeNull(),
    );
  },
};
