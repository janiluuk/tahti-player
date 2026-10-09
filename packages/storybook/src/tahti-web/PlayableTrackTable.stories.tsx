import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ContributionLine } from '@tahti-web/api/collection-contribution';
import type { TahtiPlayable } from '@tahti-web/api/types';
import { CollectionContribution } from '@tahti-web/components/CollectionContribution';
import { PlayableTrackTable } from '@tahti-web/components/PlayableTrackTable';
import { expect, fn, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof PlayableTrackTable> = {
  title: 'Tahti/Track/PlayableTrackTable',
  component: PlayableTrackTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/u/northern-lights'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const items: TahtiPlayable[] = [
  {
    id: 'sound:archive-item-1',
    kind: 'sound',
    title: 'Aurora',
    artist: 'Northern Lights',
    coverUrl: 'https://picsum.photos/seed/aurora/200/200',
    streamUrl: 'https://cdn.tahti.live/archive/aurora.mp3',
    protocol: 'https',
    channelSlug: 'northern-lights',
    durationSec: 214,
    releaseDate: '2025-11-03',
  },
  {
    id: 'sound:archive-item-2',
    kind: 'sound',
    title: 'Frost Line',
    artist: 'Northern Lights',
    coverUrl: 'https://picsum.photos/seed/frost/200/200',
    streamUrl: 'https://cdn.tahti.live/archive/frost-line.mp3',
    protocol: 'https',
    channelSlug: 'northern-lights',
    durationSec: 198,
  },
  {
    id: 'sound:archive-item-3',
    kind: 'sound',
    title: 'Imported Set',
    artist: 'Northern Lights',
    streamUrl: 'https://soundcloud.example/set.mp3',
    protocol: 'https',
    sourceProvider: 'soundcloud',
    durationSec: 1820,
  },
];

export const Default: Story = {
  args: {
    items,
  },
};

export const Editable: Story = {
  args: {
    items,
    onEdit: fn(),
  },
};

export const Empty: Story = {
  args: {
    items: [],
    emptyMessage: 'No tracks match this filter.',
  },
};

export const Removable: Story = {
  args: {
    items,
    onRemove: fn(),
  },
};

export const Selectable: Story = {
  args: {
    items,
    selectable: true,
    onBulkRemove: fn(),
  },
};

const CONTRIBUTIONS = new Map<string, ContributionLine>([
  [
    'sound:archive-item-1',
    { addedByUsername: 'kaamos-mod', note: 'Opener for Friday' },
  ],
  ['sound:archive-item-2', { addedByUsername: null, note: 'Owner note only' }],
]);

/** Shared playlist rows credit who added a track, as CollectionView does. */
export const WithContributions: Story = {
  args: {
    items,
    compactActions: true,
    getAnnotation: (item) => {
      const line = CONTRIBUTIONS.get(item.id);
      return line ? <CollectionContribution line={line} /> : null;
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lines = canvas.getAllByTestId('collection-contribution');
    await expect(lines).toHaveLength(2);
    await expect(lines[0]).toHaveTextContent(
      'Added by @kaamos-mod · “Opener for Friday”',
    );
    await expect(
      within(lines[0]!).getByRole('link', { name: '@kaamos-mod' }),
    ).toHaveAttribute('href', '/u/kaamos-mod');
    await expect(lines[1]).toHaveTextContent('“Owner note only”');
    await expect(lines[1]).not.toHaveTextContent('Added by');
  },
};
