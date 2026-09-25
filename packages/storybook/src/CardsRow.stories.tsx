import type { Meta, StoryObj } from '@storybook/react-vite';

import { CardsRow } from '@tahti-player/ui';

const meta = {
  title: 'Components/CardsRow',
  component: CardsRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Horizontally scrolling card row used on the desktop player dashboard. Orphan in tahti-web: Listen On air / Radio / artists and Discover Artists use CardGrid+Card (DirectoryArtistCardGrid) with per-item overlays CardsRowItem cannot represent. Missing states: per-item overlay/actions slot.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CardsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  filterPlaceholder: 'Filter albums...',
  nothingFound: 'No albums match your filter',
};

const items = [
  {
    id: '1',
    title: 'Midnight Drive',
    subtitle: 'Neon City',
    imageUrl: 'https://picsum.photos/300?random=1',
  },
  {
    id: '2',
    title: 'Northern Lights',
    subtitle: 'Aurora',
    imageUrl: 'https://picsum.photos/300?random=2',
  },
  {
    id: '3',
    title: 'Echoes of Silence',
    subtitle: 'The Wanderers',
    imageUrl: 'https://picsum.photos/300?random=3',
  },
  {
    id: '4',
    title: 'Fragments',
    subtitle: 'Kite & Co.',
    imageUrl: 'https://picsum.photos/300?random=4',
  },
  {
    id: '5',
    title: 'Citrus Skies',
    subtitle: 'Mango Groove',
    imageUrl: 'https://picsum.photos/300?random=5',
  },
  {
    id: '6',
    title: 'Binary Love',
    subtitle: '01100010',
    imageUrl: 'https://picsum.photos/300?random=6',
  },
  {
    id: '7',
    title: 'Crimson Tide',
    subtitle: 'Harbor',
    imageUrl: 'https://picsum.photos/300?random=7',
  },
  {
    id: '8',
    title: 'Static Bloom',
    subtitle: 'Flora',
    imageUrl: 'https://picsum.photos/300?random=8',
  },
  {
    id: '9',
    title: 'Sunset Motifs',
    subtitle: 'Parasol',
    imageUrl: 'https://picsum.photos/300?random=9',
  },
  {
    id: '10',
    title: 'Hologram',
    subtitle: 'Vapors',
    imageUrl: 'https://picsum.photos/300?random=10',
  },
];

export const WithItems: Story = {
  args: {
    title: 'Top Albums',
    items,
    labels,
  },
};

/** Phone width (375px): the filter and scroll buttons wrap under the title. */
export const MobileView: Story = {
  args: {
    title: 'Your feed',
    items,
    labels,
  },
  render: (args) => (
    <div style={{ width: 375 }}>
      <CardsRow {...args} />
    </div>
  ),
};

export const WithBadge: Story = {
  args: {
    title: 'Top Albums',
    badge: 'Acme Music',
    items,
    labels,
  },
};

export const Empty: Story = {
  args: {
    title: 'Top Albums',
    items: [],
    labels,
  },
};

const radioLabels = {
  filterPlaceholder: 'Filter stations...',
  nothingFound: 'No stations match your filter',
};

// Tahti-shaped mock data: internet radio presets, the closest real Listen
// page candidate for CardsRow (see docs/todo/storybook-cardsrow-combobox-audit.md)
// — production doesn't render this through CardsRow yet since its current
// per-item edit-cover overlay isn't representable in CardsRowItem's plain
// src/title/subtitle/onClick shape.
const radioItems = [
  { id: 'r1', title: 'Tahti Radio', subtitle: 'Curated rotation' },
  { id: 'r2', title: 'Deep Ambient FM', subtitle: 'Ambient · 128kbps' },
  { id: 'r3', title: 'Nordic Bass Collective', subtitle: 'Bass · 192kbps' },
  { id: 'r4', title: 'Warm Analog Radio', subtitle: 'Downtempo · 128kbps' },
  { id: 'r5', title: 'Late Night Techno', subtitle: 'Techno · 192kbps' },
  { id: 'r6', title: 'Fansub Community Picks', subtitle: 'Mixed · 128kbps' },
];

export const TahtiRadioRow: Story = {
  args: {
    title: 'Radio',
    items: radioItems,
    labels: radioLabels,
  },
};
