import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

const SAMPLE_IMAGE = 'https://i.imgur.com/4euOws2.jpg';

const svgDataUri = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`,
  )}`;

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

export const AnimatedWithPoster: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Animated artwork (an animated GIF in the app; an animated SVG here) with a still `posterSrc`: the poster shows at rest, the animation plays on hover or focus, and the poster stays when the viewer prefers reduced motion.',
      },
    },
  },
  args: {
    src: svgDataUri(
      '<rect width="64" height="64" fill="#A78BFA"><animate attributeName="fill" values="#A78BFA;#22D3EE;#F472B6;#A78BFA" dur="1.5s" repeatCount="indefinite"/></rect>',
    ),
    posterSrc: svgDataUri('<rect width="64" height="64" fill="#A78BFA"/>'),
    size: 'lg',
    className: 'rounded-full',
  },
};

export const NoArtwork: Story = {
  args: {
    src: null,
    size: 'md',
    className: 'rounded-lg',
  },
};
