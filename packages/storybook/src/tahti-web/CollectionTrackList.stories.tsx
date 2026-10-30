import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import { CollectionTrackList } from '@tahti-web/components/CollectionTrackList';
import { expect, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const track = (id: string, title: string, coverUrl: string): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title,
  artist: 'Northern Lights',
  coverUrl,
  streamUrl: `https://cdn.example/${id}.mp3`,
  protocol: 'https',
  durationSec: 240,
});

const ITEMS: TahtiPlayable[] = [
  track('s1', 'Polar Static', '/mock/northern-lights/cover-polar-static.svg'),
  track('s2', 'First Light', '/mock/northern-lights/cover-first-light.svg'),
];

const meta: Meta<typeof CollectionTrackList> = {
  title: 'Tahti/Collection/CollectionTrackList',
  component: CollectionTrackList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The track list of a playlist (`CollectionView`) or a release smart link (`SmartLinkView`): framed ambient rows with an optional heading, or the empty state when nothing can play. Without `empty`, an empty list renders nothing.',
      },
    },
  },
  decorators: [withTahtiRouter('/')],
  args: { items: ITEMS },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playlist: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: 'Polar Static' })).toBeVisible(),
    );
    await expect(canvas.queryByRole('region')).toBeNull();
  },
};

export const WithHeading: Story = {
  args: { title: 'Tracks' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole('region', { name: 'Tracks' });
    await expect(
      within(section).getByRole('link', { name: 'First Light' }),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    items: [],
    empty: {
      title: 'No tracks in this playlist',
      description: "This playlist doesn't have any tracks yet.",
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByText('No tracks in this playlist'),
      ).toBeVisible(),
    );
  },
};

export const EmptyWithoutMessage: Story = {
  args: { items: [], empty: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('collection-track-list')).toBeNull();
    await expect(canvas.queryByText(/No tracks/)).toBeNull();
  },
};
