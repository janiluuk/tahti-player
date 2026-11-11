import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { LikedTrack } from '@tahti-web/api/likes';
import type { TahtiPlayable } from '@tahti-web/api/types';
import { useLibraryStore } from '@tahti-web/stores/libraryStore';
import { FavoritesView } from '@tahti-web/views/FavoritesView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const radioFavorite: TahtiPlayable = {
  id: 'radio:radio-helsinki',
  kind: 'radio',
  title: 'Radio Helsinki',
  artist: 'Radio Helsinki',
  coverUrl: 'https://picsum.photos/seed/radio-helsinki/200',
  streamUrl: 'https://example.com/radio-helsinki.mp3',
  protocol: 'https',
  sourceProvider: 'radio',
};

const likedTracks: LikedTrack[] = [
  {
    id: 'liked-moonlight-drive',
    title: 'Moonlight Drive',
    bannerUrl: '/mock/northern-lights/cover-first-light.svg',
    audioUrl: 'https://example.com/moonlight-drive.mp3',
    channelSlug: 'northern-lights',
    artistUsername: 'northern-lights',
    artistDisplayName: 'Northern Lights',
    likedAt: '2026-11-01T18:00:00.000Z',
    url: '/t/liked-moonlight-drive',
    durationSec: 214,
    likeCount: 12,
  },
  {
    id: 'liked-after-hours',
    title: 'After Hours Drive',
    bannerUrl: '/mock/dj-moonlight/cover-after-hours.svg',
    audioUrl: 'https://example.com/after-hours.mp3',
    channelSlug: 'dj-moonlight',
    artistUsername: 'dj-moonlight',
    artistDisplayName: 'DJ Moonlight',
    likedAt: '2026-10-21T21:00:00.000Z',
    url: '/t/liked-after-hours',
    durationSec: 312,
    likeCount: 4,
  },
];

const seedLibrary =
  (favoriteTracks: TahtiPlayable[]): Decorator =>
  (Story) => {
    useLibraryStore.setState({ favoriteChannels: [], favoriteTracks });
    return <Story />;
  };

const meta: Meta<typeof FavoritesView> = {
  title: 'Tahti/Library/FavoritesView',
  component: FavoritesView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Favorites: channel and radio-station cards, then one Liked tracks list from the account likes (the heart). Signed out, the list asks the listener to sign in.',
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LikedTracksAndStations: Story = {
  decorators: [seedLibrary([radioFavorite])],
  parameters: { mockData: mockData({ myLikes: likedTracks }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Moonlight Drive'),
    ).toBeInTheDocument();
    await expect(
      canvas.getAllByRole('heading', { name: 'Liked tracks' }),
    ).toHaveLength(1);
    await expect(canvas.queryByText('Liked on Tahti')).toBeNull();
    await expect(
      canvas.getByRole('link', { name: 'Radio Helsinki' }),
    ).toBeInTheDocument();
  },
};

export const NoLikedTracks: Story = {
  decorators: [seedLibrary([])],
  parameters: { mockData: mockData({ myLikes: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No liked tracks'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Find music' }),
    ).toHaveAttribute('href', '/discover');
  },
};

export const SignedOut: Story = {
  decorators: [seedLibrary([]), withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Sign in to see the tracks you like'),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  },
};
