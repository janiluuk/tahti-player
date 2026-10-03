import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

const SAMPLE_IMAGE = 'https://i.imgur.com/4euOws2.jpg';

const meta: Meta<typeof MediaArtwork> = {
  title: 'Components/MediaArtwork',
  component: MediaArtwork,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cover art with optional play / queue / favorite overlays. Size `thumb` is the standard track-row thumbnail. Queue, favorite, and extra `actions` only appear on `lg` and `fill` — smaller sizes show play only so overlays stay readable. Hover (fine pointer) or always-on (touch) reveals controls.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof MediaArtwork>>;

function Interactive({ size }: { size: 'sm' | 'thumb' | 'md' | 'lg' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  return (
    <MediaArtwork
      src={SAMPLE_IMAGE}
      alt="Cover art"
      size={size}
      className="rounded-lg"
      isPlaying={isPlaying}
      onPlay={() => setIsPlaying((v) => !v)}
      onQueue={() => {}}
      onFavorite={() => setFavorited((v) => !v)}
      favorited={favorited}
    />
  );
}

export const Small: Story = {
  render: () => <Interactive size="sm" />,
};

export const Thumb: Story = {
  render: () => <Interactive size="thumb" />,
};

export const Medium: Story = {
  render: () => <Interactive size="md" />,
};

export const Large: Story = {
  render: () => <Interactive size="lg" />,
};

export const NoArtwork: Story = {
  args: {
    src: null,
    size: 'md',
    className: 'rounded-lg',
  },
};

export const ThemedFallback: Story = {
  args: {
    src: null,
    size: 'lg',
    className: 'rounded-full',
    fallbackBackground: 'linear-gradient(135deg, #A78BFA, #22D3EE)',
    placeholder: (
      <span className="text-5xl font-extrabold text-white/90">S</span>
    ),
  },
};
