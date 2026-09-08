import type { Meta, StoryObj } from '@storybook/react-vite';
import { EntitySocialHeader } from '@tahti-web/components/EntitySocialHeader';
import {
  CalendarIcon,
  HeartIcon,
  ListMusicIcon,
  MusicIcon,
  RadioIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';

import { Button } from '@tahti-player/ui';

const meta: Meta<typeof EntitySocialHeader> = {
  title: 'Tahti/Page/EntitySocialHeader',
  component: EntitySocialHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Public entity header: `bg-primary` card, optional backdrop or visualizer under a scrim, identity row, icon StatChips inside the header, actions top-right. Used on Artist, Collection/Playlist, Channel (no designer hero), Radio show, Venue, and Smart-link/release pages. Not used on Admin dashboards (those keep large StatNumber KPI panels).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ARTIST_STATS = [
  { key: 'followers', label: 'Followers', value: 479_000, icon: UsersIcon },
  { key: 'following', label: 'Following', value: 14, icon: UserPlusIcon },
  { key: 'tracks', label: 'Tracks', value: 97, icon: MusicIcon },
  { key: 'playlists', label: 'Playlists', value: 5, icon: ListMusicIcon },
];

export const Artist: Story = {
  args: {
    title: 'Pooh Shiesty',
    imageUrl: 'https://picsum.photos/seed/tahti-artist-header/256',
    roundImage: true,
    location: 'Memphis',
    subtitle: '@poohshiesty',
    description: 'Independent artist on Tahti.',
    visualizerPreset: 'AURORA',
    artworkUrlForVisualizer:
      'https://picsum.photos/seed/tahti-artist-header/512',
    stats: ARTIST_STATS,
    actions: (
      <Button
        size="icon-sm"
        variant="secondary"
        className="bg-background border-border rounded-md border-(length:--border-width)"
        aria-label="Favorite"
      >
        <HeartIcon size={16} aria-hidden />
      </Button>
    ),
    'data-testid': 'artist-social-header',
  },
};

export const ArtistWithBackdrop: Story = {
  name: 'Artist + backdrop image',
  args: {
    ...Artist.args,
    backdropUrl: 'https://picsum.photos/seed/tahti-artist-backdrop/1200/600',
    visualizerPreset: undefined,
  },
};

export const ArtistWithGradientLook: Story = {
  name: 'Artist + GRADIENT look',
  args: {
    ...Artist.args,
    headerStyle: 'GRADIENT',
    colorScheme: {
      accent: '#22D3EE',
      highlight: '#A78BFA',
      bg: '#0B1220',
      text: '#F8FAFC',
      muted: '#64748B',
    },
    visualizerPreset: undefined,
  },
};

export const Collection: Story = {
  name: 'Collection / playlist',
  args: {
    title: 'Night Bus Selections',
    imageUrl: 'https://picsum.photos/seed/tahti-collection-header/256',
    subtitle: 'by Northern Lights',
    description: 'Late-night mixes and collaborative cuts.',
    visualizerPreset: 'WATER_RIPPLE',
    artworkUrlForVisualizer:
      'https://picsum.photos/seed/tahti-collection-header/512',
    stats: [
      { key: 'tracks', label: 'Tracks', value: 24, icon: MusicIcon },
      { key: 'followers', label: 'Followers', value: 1284, icon: UsersIcon },
    ],
    actions: (
      <Button
        size="icon-sm"
        variant="secondary"
        className="bg-background border-border rounded-md border-(length:--border-width)"
        aria-label="Favorite"
      >
        <HeartIcon size={16} aria-hidden />
      </Button>
    ),
    children: (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary">
          Play
        </Button>
        <Button size="sm" variant="secondary">
          Add to queue
        </Button>
      </div>
    ),
    'data-testid': 'collection-social-header',
  },
};

export const CollectionEditable: Story = {
  name: 'Collection / playlist — editable cover',
  args: {
    ...Collection.args,
    onImageClick: () => {},
    onImageDelete: () => {},
    'data-testid': 'collection-social-header-editable',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Studio edit views pass `onImageClick` (upload/replace) and `onImageDelete` (hover-reveal X, clears the image) together — used by Collection, Release, Show, and Sound edit headers.',
      },
    },
  },
};

export const Channel: Story = {
  args: {
    title: 'Northern Lights',
    imageUrl: 'https://picsum.photos/seed/tahti-channel-header/256',
    roundImage: true,
    subtitle: '@northernlights',
    description: 'Live channel when the designer hero block is off.',
    backdropUrl: 'https://picsum.photos/seed/tahti-channel-backdrop/1200/600',
    stats: [
      { key: 'followers', label: 'Followers', value: 12_400, icon: UsersIcon },
    ],
    'data-testid': 'channel-social-header',
  },
};

export const RadioShow: Story = {
  args: {
    title: 'Midnight Frequency',
    imageUrl: 'https://picsum.photos/seed/tahti-show-header/256',
    roundImage: true,
    subtitle: '@dj-mira · Show on Tahti Radio',
    visualizerPreset: 'AURORA',
    stats: [
      { key: 'upcoming', label: 'Upcoming', value: 3, icon: CalendarIcon },
      { key: 'past', label: 'Past episodes', value: 18, icon: RadioIcon },
    ],
    'data-testid': 'radio-show-social-header',
  },
};

export const Venue: Story = {
  args: {
    title: 'Kuudes Linja',
    imageUrl: 'https://picsum.photos/seed/tahti-venue-header/256',
    location: 'Helsinki, Finland',
    description: 'Verified venue on Tahti.',
    backdropUrl: 'https://picsum.photos/seed/tahti-venue-backdrop/1200/600',
    stats: [
      { key: 'capacity', label: 'Capacity', value: 450, icon: UsersIcon },
    ],
    'data-testid': 'venue-social-header',
  },
};

export const Release: Story = {
  name: 'Smart link / release',
  args: {
    title: 'Glass Harbor',
    imageUrl: 'https://picsum.photos/seed/tahti-release-header/256',
    subtitle: 'Northern Lights',
    description: '2024 · Electronic · Album',
    visualizerPreset: 'WATER_RIPPLE',
    artworkUrlForVisualizer:
      'https://picsum.photos/seed/tahti-release-header/512',
    stats: [{ key: 'tracks', label: 'Tracks', value: 11, icon: MusicIcon }],
    children: (
      <Button size="sm" variant="secondary">
        Play all
      </Button>
    ),
    'data-testid': 'release-social-header',
  },
};
