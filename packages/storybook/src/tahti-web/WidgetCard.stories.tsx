import type { Meta, StoryObj } from '@storybook/react-vite';
import { WidgetCard } from '@tahti-web/components/discover/WidgetCard';

import { Select } from '@tahti-player/ui';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof WidgetCard> = {
  title: 'Tahti/Discover/WidgetCard',
  component: WidgetCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Discover tab ranking/list panels. Intentionally not CardGrid — dense track rows via WidgetTrackRow, not media Card tiles. If a widget grows cover tiles later, nest CardGrid+Card inside the panel.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/discover')],
  args: {
    onMove: () => {},
    onRemove: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const tracks = [
  {
    id: 'archive:track-1',
    title: 'Tundra Static',
    artist: 'Northern Lights',
    channelSlug: 'northern-lights',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
    listens: 4213,
  },
  {
    id: 'archive:track-2',
    title: 'Aurora Drift',
    artist: 'Kasari',
    channelSlug: 'kasari',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
    listens: 1892,
  },
];

export const RankedList: Story = {
  args: {
    id: 'this-week-most-played',
    title: 'Most played this week',
    loading: false,
    items: tracks,
    showRank: true,
    emptyMessage: 'No plays yet this week.',
    canMoveUp: false,
    canMoveDown: true,
  },
};

export const ArtistOfTheWeek: Story = {
  args: {
    id: 'artist-of-the-week',
    title: 'Artist of the week',
    loading: false,
    items: [],
    artist: {
      username: 'northern-lights',
      displayName: 'Northern Lights',
      bio: 'Ambient / downtempo, streaming most weeknights.',
      avatarUrl: null,
      channelSlug: 'northern-lights',
    },
    emptyMessage: 'No artist picked yet.',
    canMoveUp: true,
    canMoveDown: false,
  },
};

export const Loading: Story = {
  args: {
    id: 'latest-tracks',
    title: 'Latest tracks',
    loading: true,
    items: [],
    emptyMessage: 'No tracks yet.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

export const Empty: Story = {
  args: {
    id: 'loved',
    title: 'Loved',
    loading: false,
    items: [],
    emptyMessage: 'Love a track to see it here.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

export const LoadError: Story = {
  args: {
    id: 'latest-tracks',
    title: 'Latest tracks',
    loading: false,
    error: 'Server unavailable',
    onRetry: () => {},
    items: [],
    emptyMessage: 'No tracks yet.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

export const RandomArtistWithSettings: Story = {
  args: {
    id: 'random-artist',
    title: 'Random artist pick',
    loading: false,
    items: [],
    artist: {
      username: 'kasari',
      displayName: 'Kasari',
      bio: 'Downtempo electronica from Helsinki, live most Fridays.',
      avatarUrl: null,
      channelSlug: 'kasari',
    },
    emptyMessage: 'No artist picked yet.',
    canMoveUp: true,
    canMoveDown: true,
    settings: (
      <Select
        label="Keep the same pick for"
        value="7"
        onValueChange={() => {}}
        options={[
          { id: '1', label: '1 day' },
          { id: '3', label: '3 days' },
          { id: '7', label: '7 days' },
          { id: '14', label: '14 days' },
          { id: '30', label: '30 days' },
        ]}
      />
    ),
  },
};

export const PublicPlaylists: Story = {
  args: {
    id: 'public-playlists',
    title: 'Public playlists',
    loading: false,
    items: [],
    collections: [
      {
        slug: 'night-drive',
        name: 'Night drive selections',
        description: 'Warm synths and late-night movement.',
        coverUrl: null,
        itemCount: 12,
        ownerUsername: 'northern-lights',
        ownerDisplayName: 'Northern Lights',
      },
      {
        slug: 'weekend-radio',
        name: 'Weekend radio',
        description: 'A shared collection for slow Saturday mornings.',
        coverUrl: null,
        itemCount: 8,
        ownerUsername: 'kasari',
        ownerDisplayName: 'Kasari',
      },
    ],
    emptyMessage: 'No public playlists yet.',
    canMoveUp: false,
    canMoveDown: true,
  },
};
