import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChannelDirectoryItem } from '@tahti-web/api/types';
import { DirectoryArtistCardGrid } from '@tahti-web/components/DirectoryArtistCardGrid';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

/**
 * Artist card grid used by DirectoryArtistsBrowser (Discover → Artists,
 * Listen → directory) — an ambient avatar wash behind the grid plus
 * play/queue/favorite per card. `liveIndicator` switches between a "Live"
 * badge (Discover) and an "Active ·" text prefix (Listen).
 */
const meta: Meta<typeof DirectoryArtistCardGrid> = {
  title: 'Tahti/Discover/DirectoryArtistCardGrid',
  component: DirectoryArtistCardGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/discover'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const artists: ChannelDirectoryItem[] = [
  {
    slug: 'northern-lights',
    username: 'northern-lights',
    displayName: 'Northern Lights',
    avatarUrl: 'https://picsum.photos/seed/northern-lights/300/300',
    genres: ['Ambient', 'Downtempo'],
    isActive: true,
  },
  {
    slug: 'kasari',
    username: 'kasari',
    displayName: 'Kasari',
    avatarUrl: 'https://picsum.photos/seed/kasari/300/300',
    genres: ['Synthwave'],
    isActive: false,
  },
  {
    slug: 'midnight-cartography',
    username: 'midnight-cartography',
    displayName: 'Midnight Cartography',
    avatarUrl: null,
    genres: ['Field recording', 'Drone'],
    isActive: false,
  },
];

export const BadgeIndicator: Story = {
  name: 'Badge live indicator (Discover)',
  args: { artists, liveIndicator: 'badge' },
};

export const TextIndicator: Story = {
  name: 'Text live indicator (Listen)',
  args: { artists, liveIndicator: 'text' },
};
