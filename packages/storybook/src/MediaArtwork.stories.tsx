import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from 'storybook/test';

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
          'Cover art with optional play / queue / favorite overlays. Size `thumb` is the standard track-row thumbnail. Queue, favorite, and extra `actions` only appear as corner overlays on `lg` and `fill` — smaller sizes show play only so overlays stay readable. When `onQueue` is set, the play control’s label notes “Shift+click to queue”; holding Shift swaps the play icon for a queue icon and Shift+click runs `onQueue` instead of `onPlay`. Hover (fine pointer) or always-on (touch) reveals controls.',
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
  const [queued, setQueued] = useState(0);
  return (
    <div className="flex flex-col items-center gap-2">
      <MediaArtwork
        src={SAMPLE_IMAGE}
        alt="Cover art"
        size={size}
        className="rounded-lg"
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying((v) => !v)}
        onQueue={() => setQueued((n) => n + 1)}
        queueActive={queued > 0}
        onFavorite={() => setFavorited((v) => !v)}
        favorited={favorited}
      />
      <p className="text-muted-foreground m-0 text-xs">
        Hold Shift to queue · queued {queued}
      </p>
    </div>
  );
}

export const Small: Story = {
  render: () => <Interactive size="sm" />,
};

export const Thumb: Story = {
  render: () => <Interactive size="thumb" />,
  parameters: {
    docs: {
      description: {
        story:
          'Track-row size. Hold Shift: play becomes a queue icon; Shift+click adds to queue. Plain click still plays.',
      },
    },
  },
};

export const Medium: Story = {
  render: () => <Interactive size="md" />,
};

export const Large: Story = {
  render: () => <Interactive size="lg" />,
};

/** Documents Shift+held icon swap and Shift+click queue for the shared play control. */
export const ShiftClickQueues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'With `onQueue` set: aria-label is “Play · Shift+click to queue”; holding Shift shows the queue icon and “Add to queue”; Shift+click calls `onQueue`; plain click calls `onPlay`.',
      },
    },
  },
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Cover art',
    size: 'md',
    className: 'rounded-lg',
    imageReveal: false,
    onPlay: fn(),
    onQueue: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const play = await canvas.findByTestId('media-artwork-play');
    await expect(play).toHaveAttribute(
      'aria-label',
      'Play · Shift+click to queue',
    );

    fireEvent.keyDown(window, { key: 'Shift', shiftKey: true });
    await waitFor(() =>
      expect(play).toHaveAttribute('aria-label', 'Add to queue'),
    );

    fireEvent.click(play, { shiftKey: true });
    await expect(args.onQueue).toHaveBeenCalledOnce();
    await expect(args.onPlay).not.toHaveBeenCalled();

    fireEvent.keyUp(window, { key: 'Shift', shiftKey: false });
    await waitFor(() =>
      expect(play).toHaveAttribute('aria-label', 'Play · Shift+click to queue'),
    );

    fireEvent.click(play);
    await expect(args.onPlay).toHaveBeenCalledOnce();
  },
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
    alt: 'Animated cover',
    size: 'lg',
    className: 'rounded-full',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const cover = () => canvas.getByRole('img', { name: 'Animated cover' });
    await expect(cover()).toHaveAttribute('src', args.posterSrc);
    await userEvent.hover(canvas.getByTestId('media-artwork'));
    await waitFor(() => expect(cover()).toHaveAttribute('src', args.src));
    await userEvent.unhover(canvas.getByTestId('media-artwork'));
    await waitFor(() => expect(cover()).toHaveAttribute('src', args.posterSrc));
  },
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

/** `fit="contain"` letterboxes (live station logos, previews that must not be
 * cropped); the default `cover` fills and crops. */
export const FitContain: Story = {
  render: () => (
    <div className="flex gap-4">
      {(['cover', 'contain'] as const).map((fit) => (
        <div key={fit} className="flex flex-col items-center gap-2">
          <div className="bg-background-secondary relative h-32 w-48 rounded-lg">
            <MediaArtwork
              src={SAMPLE_IMAGE}
              alt=""
              fit={fit}
              imageReveal={false}
              className="rounded-lg"
            />
          </div>
          <p className="text-foreground-secondary m-0 text-xs">{fit}</p>
        </div>
      ))}
    </div>
  ),
};
