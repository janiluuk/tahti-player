import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import { useLibraryStore } from '@tahti-web/stores/libraryStore';
import { FavoritesView } from '@tahti-web/views/FavoritesView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const radioFavorite: TahtiPlayable = {
  id: 'radio:radio-helsinki',
  kind: 'radio',
  title: 'Radio Helsinki',
  artist: 'Radio Helsinki',
  coverUrl: 'https://www.streamurl.link/logos/JoiOnv3Q9An.webp',
  streamUrl: 'https://example.com/radio-helsinki.mp3',
  protocol: 'https',
  sourceProvider: 'radio',
};

const audioFavorite: TahtiPlayable = {
  id: 'sound:favourite-track',
  kind: 'sound',
  title: 'Moonlight Drive',
  artist: 'Northern Lights',
  coverUrl: '/mock/northern-lights/cover-first-light.svg',
  streamUrl: 'https://example.com/moonlight-drive.mp3',
  protocol: 'https',
  sourceProvider: 'tahti',
};

const meta: Meta<typeof FavoritesView> = {
  title: 'Tahti/Library/FavoritesView',
  component: FavoritesView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Favorites separates radio stations into channel cards and keeps the Tracks list for audio files and embeds only.',
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RadioChannelsAndTracks: Story = {
  decorators: [
    (Story) => {
      useLibraryStore.setState({
        favoriteChannels: [],
        favoriteTracks: [radioFavorite, audioFavorite],
      });
      return <Story />;
    },
  ],
};
