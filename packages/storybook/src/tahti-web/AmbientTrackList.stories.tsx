import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from '@tahti-web/components/AmbientTrackList';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Input, Select } from '@tahti-player/ui';

import {
  WAVEFORM_DEMO_DURATION,
  WAVEFORM_DEMO_URL,
} from './_fixtures/waveformAudio';
import { pickTrackView, withinBody } from './_lib/play';
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
          'Listing of ambient+waveform rows. The toolbar row holds an optional filter box, sort, and a Track size button whose popover picks Large / Medium / Small (plus Grid / List where offered).',
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

/** Grid offered (as on Collections, Favorites, Listen): pick it from the
 * Track size popover to see cover cards with play. */
export const WithGrid: Story = {
  args: {
    items: ITEMS,
    allowGrid: true,
    persistDensity: false,
  },
  play: async ({ canvasElement }) => {
    await pickTrackView(canvasElement, 'Grid');
    await waitFor(() =>
      expect(
        within(canvasElement).getByTestId('ambient-track-grid'),
      ).toBeVisible(),
    );
  },
};

/** The Track size popover open: row sizes, Grid and List, current checked. */
export const TrackSizePopover: Story = {
  args: {
    items: ITEMS,
    allowGrid: true,
    renderList: () => <p>Plain table</p>,
    persistDensity: false,
    defaultDensity: 'compact',
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Track size: Medium',
      }),
    );
    const body = withinBody(canvasElement);
    await waitFor(() =>
      expect(body.getByRole('menu', { name: 'Track size' })).toBeVisible(),
    );
    await expect(
      body
        .getAllByRole('menuitemradio')
        .map((item: HTMLElement) => item.textContent),
    ).toEqual(['Large', 'Medium', 'Small', 'Grid', 'List']);
    await expect(
      body.getByRole('menuitemradio', { name: 'Medium' }),
    ).toHaveAttribute('aria-checked', 'true');
  },
};

/** A page filter leads the toolbar: filter box, sort and the Track size
 * button share one row (desktop library local files). */
export const FilterSortAndSizeRow: Story = {
  args: {
    items: ITEMS,
    persistDensity: false,
    toolbarStart: (
      <Input
        type="search"
        aria-label="Search tracks"
        placeholder="Title, artist, or file name"
      />
    ),
    toolbarEnd: (
      <Select
        className="w-44"
        aria-label="Sort tracks"
        options={[
          { id: 'default', label: 'Default order' },
          { id: 'title', label: 'Title A–Z' },
        ]}
        value="default"
        onValueChange={() => undefined}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const toolbar = within(
      within(canvasElement).getByTestId('ambient-track-list-toolbar'),
    );
    const controls = [
      toolbar.getByRole('searchbox', { name: 'Search tracks' }),
      toolbar.getByRole('button', { name: 'Sort tracks' }),
      toolbar.getByRole('button', { name: /^Track size/ }),
    ];
    const centers = controls.map((control) => {
      const box = control.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    for (const center of centers) {
      await expect(Math.abs(center - centers[0])).toBeLessThan(4);
    }
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
