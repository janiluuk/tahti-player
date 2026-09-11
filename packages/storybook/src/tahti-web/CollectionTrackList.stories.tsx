import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import { CollectionTrackList } from '@tahti-web/components/CollectionTrackList';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

/**
 * Per-track waveform row list for a Set/Collection page — each track gets
 * its own scrubbable waveform and transport, rather than a single compact
 * table row. Used by CollectionView (and reused when a collection is
 * opened from the artist page).
 */
const meta: Meta<typeof CollectionTrackList> = {
  title: 'Tahti/Track/CollectionTrackList',
  component: CollectionTrackList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/u/northern-lights/c/late-night-set'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const items: TahtiPlayable[] = [
  {
    id: 'sound:collection-item-1',
    kind: 'sound',
    title: 'Aurora',
    artist: 'Northern Lights',
    coverUrl: 'https://picsum.photos/seed/aurora/200/200',
    streamUrl: 'https://cdn.tahti.live/archive/aurora.mp3',
    protocol: 'https',
    channelSlug: 'northern-lights',
    durationSec: 214,
  },
  {
    id: 'sound:collection-item-2',
    kind: 'sound',
    title: 'Frost Line',
    artist: 'Northern Lights',
    coverUrl: 'https://picsum.photos/seed/frost/200/200',
    streamUrl: 'https://cdn.tahti.live/archive/frost-line.mp3',
    protocol: 'https',
    channelSlug: 'northern-lights',
    durationSec: 187,
  },
  {
    id: 'sound:collection-item-3',
    kind: 'sound',
    title: 'Tundra Static',
    artist: 'Northern Lights',
    coverUrl: null,
    streamUrl: 'https://cdn.tahti.live/archive/tundra-static.mp3',
    protocol: 'https',
    channelSlug: 'northern-lights',
    durationSec: 301,
  },
];

export const Default: Story = {
  args: { items },
};

export const Empty: Story = {
  name: 'Empty (renders nothing)',
  args: { items: [] },
};
