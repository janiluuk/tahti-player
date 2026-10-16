import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlowMediaTile } from '@tahti-web/components/GlowMediaTile';

const meta: Meta<typeof GlowMediaTile> = {
  title: 'Tahti/Media/GlowMediaTile',
  component: GlowMediaTile,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Grid tile over MediaArtwork. With `onQueue`, hold Shift on the play control to queue (same Shift+click / Shift-held icon behavior as Components/MediaArtwork).',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    title: 'Northern Lights',
    subtitle: 'Aurora — Single',
    src: 'https://picsum.photos/seed/glow1/400',
    onClick: () => {},
    onPlay: () => {},
    onQueue: () => {},
    onFavorite: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Favorited: Story = {
  args: {
    favorited: true,
  },
};

export const CustomGlow: Story = {
  args: {
    glowColor: '#22d3ee',
    subtitle: 'Ambient / downtempo',
  },
};

export const NoArtwork: Story = {
  args: {
    src: undefined,
  },
};
