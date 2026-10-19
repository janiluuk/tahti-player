import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from '@tahti-web/components/AmbientTrackList';
import { mockAmbientPeaks } from '@tahti-web/components/AmbientTrackRow';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

const COVER_A = '/mock/northern-lights/cover-first-light.svg';
const COVER_B = '/mock/dj-moonlight/cover-after-hours.svg';
const COVER_C = '/mock/northern-lights/cover-polar-static.svg';

const ITEMS: AmbientTrackListItem[] = [
  {
    id: '1',
    trackId: 'story-1',
    title: 'Moody Electronica vol. 40',
    artist: 'Yaniho',
    coverUrl: COVER_A,
    genreLabel: 'Progressive House',
    durationLabel: '46:03',
    peaks: mockAmbientPeaks(1),
    progress: 0.22,
    ambientRgb: [72, 48, 140],
    actions: (
      <>
        <Button size="sm" variant="text">
          Like
        </Button>
        <Button size="sm" variant="text">
          Add
        </Button>
      </>
    ),
  },
  {
    id: '2',
    trackId: 'story-2',
    title: 'Diamond Dust',
    artist: 'Yaniho',
    coverUrl: COVER_B,
    genreLabel: 'Deep House',
    durationLabel: '6:11',
    peaks: mockAmbientPeaks(2),
    progress: 0.05,
    ambientRgb: [160, 40, 90],
    actions: (
      <Button size="sm" variant="text">
        Add
      </Button>
    ),
  },
  {
    id: '3',
    trackId: 'story-3',
    title: 'Polar Static',
    artist: 'Northern Lights',
    coverUrl: COVER_C,
    genreLabel: 'Ambient',
    durationLabel: '8:40',
    peaks: mockAmbientPeaks(3),
    progress: 0,
    ambientRgb: [36, 78, 128],
  },
];

const meta = {
  title: 'Tahti/Media/AmbientTrackList',
  component: AmbientTrackList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Listing of ambient+waveform rows with a top track-size control (Large / Medium / Small). Used on Library → Sounds.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-background mx-auto w-full max-w-3xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AmbientTrackList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: ITEMS,
    persistDensity: false,
    defaultDensity: 'comfortable',
  },
};

export const CompactDefault: Story = {
  args: {
    items: ITEMS,
    persistDensity: false,
    defaultDensity: 'compact',
  },
};

export const DenseDefault: Story = {
  args: {
    items: ITEMS,
    persistDensity: false,
    defaultDensity: 'dense',
  },
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [density, setDensity] = useState<'comfortable' | 'compact' | 'dense'>(
      'comfortable',
    );
    return (
      <AmbientTrackList
        items={ITEMS}
        density={density}
        onDensityChange={setDensity}
        toolbarEnd={
          <span className="text-foreground-secondary text-xs">
            Size: {density}
          </span>
        }
      />
    );
  },
};

export const Empty: Story = {
  args: {
    items: [],
    persistDensity: false,
    emptyMessage: 'Nothing in this filter.',
  },
};
