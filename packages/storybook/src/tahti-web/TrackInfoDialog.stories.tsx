import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import {
  TrackInfoDialog,
  type TrackInfo,
} from '@tahti-web/components/TrackInfoDialog';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof TrackInfoDialog> = {
  title: 'Tahti/Track/TrackInfoDialog',
  component: TrackInfoDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/u/northern-lights')],
  args: {
    isOpen: true,
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const playable: TahtiPlayable = {
  id: 'sound:archive-item-1',
  kind: 'sound',
  title: 'Aurora',
  artist: 'Northern Lights',
  coverUrl: 'https://picsum.photos/seed/aurora/200/200',
  streamUrl: 'https://cdn.tahti.live/archive/aurora.mp3',
  protocol: 'https',
  channelSlug: 'northern-lights',
};

// Signed in as the track's own artist — shows love / add-to-playlist and
// (because the signed-in user has a channel) the Mixcloud export section.
export const WithArtistTools: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  args: {
    track: {
      title: 'Aurora',
      artistName: 'Northern Lights',
      artistUsername: 'northern-lights',
      artworkUrl: 'https://picsum.photos/seed/aurora/200/200',
      meta: '3m ago',
      playable,
      tracklist: [
        { id: 'archive-item-1', title: 'Aurora', active: true },
        { id: 'archive-item-2', title: 'Frost Line', onSelect: () => {} },
        {
          id: 'archive-item-3',
          title: 'Aurora (Reprise)',
          onSelect: () => {},
        },
      ],
    } satisfies TrackInfo,
  },
};

// A live/ephemeral signal with no catalog entry — no love/playlist icons,
// no tracklist, and shown to a signed-out listener.
export const LiveSignalNoCatalogEntry: Story = {
  decorators: [withMockAuth(null)],
  args: {
    track: {
      title: 'Tahti Radio — live now',
      artistName: 'DJ Frost',
      artistUsername: null,
      artworkUrl: null,
      meta: 'Live now',
      playable: null,
    } satisfies TrackInfo,
  },
};
