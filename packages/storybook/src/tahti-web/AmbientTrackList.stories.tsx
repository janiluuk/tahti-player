import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from '@tahti-web/components/AmbientTrackList';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { Button } from '@tahti-player/ui';

import {
  WAVEFORM_DEMO_DURATION,
  WAVEFORM_DEMO_URL,
} from './_fixtures/waveformAudio';
import { mockAmbientPeaks } from './mockAmbientPeaks';

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
    durationSec: 2763,
    peaks: mockAmbientPeaks(1, 4096),
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
    durationSec: 371,
    peaks: mockAmbientPeaks(2, 4096),
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
    durationSec: 520,
    peaks: mockAmbientPeaks(3, 4096),
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

async function verifyListing(canvasElement: HTMLElement) {
  const rows = within(canvasElement).getAllByTestId('ambient-track-row');
  await expect(rows).toHaveLength(3);
  for (const row of rows) {
    row.scrollIntoView({ block: 'nearest' });
    const wave = await within(row).findByRole('img', { name: /^Seek / });
    await waitFor(() => expect(wave).toHaveAttribute('data-state', 'ready'));
    await expect(wave).toHaveAttribute('data-waveform', 'peaks');
    await expect(wave).toBeVisible();
    await expect(wave.getBoundingClientRect().width).toBeGreaterThan(100);
  }
}

export const Default: Story = {
  play: async ({ canvasElement }) => verifyListing(canvasElement),
  args: {
    items: ITEMS,
    persistDensity: false,
    defaultDensity: 'comfortable',
  },
};

export const CompactDefault: Story = {
  play: Default.play,
  args: {
    items: ITEMS,
    persistDensity: false,
    defaultDensity: 'compact',
  },
};

export const DenseDefault: Story = {
  play: Default.play,
  args: {
    items: ITEMS,
    persistDensity: false,
    defaultDensity: 'dense',
  },
};

/** Grid offered (as on Collections, Favorites, Listen): pick it in the
 * switcher to see cover cards with play; the choice is remembered. */
export const WithGrid: Story = {
  args: {
    items: ITEMS,
    allowGrid: true,
    persistDensity: false,
  },
};

export const Controlled: StoryObj<typeof AmbientTrackList> = {
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

export const PhoneWidth: Story = {
  ...Default,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[358px]">
        <Story />
      </div>
    ),
  ],
};

export const DecodeMissingPeaks: Story = {
  args: {
    items: ITEMS.map((item) => ({
      ...item,
      peaks: null,
      audioUrl: WAVEFORM_DEMO_URL,
      durationSec: WAVEFORM_DEMO_DURATION,
      durationLabel: '0:03',
    })),
    persistDensity: false,
    defaultDensity: 'comfortable',
  },
  play: Default.play,
};

export const ProcessingUpload: Story = {
  args: {
    items: [
      ...ITEMS.slice(0, 2),
      { ...ITEMS[2]!, title: 'New upload', peaks: null, processing: true },
    ],
    persistDensity: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Processing audio',
    );
    const waves = await canvas.findAllByRole('img', { name: /^Seek / });
    await expect(waves).toHaveLength(2);
    for (const wave of waves) {
      await waitFor(() => expect(wave).toHaveAttribute('data-state', 'ready'));
    }
  },
};
