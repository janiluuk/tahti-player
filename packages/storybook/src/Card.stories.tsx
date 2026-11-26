import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';

import { Card, MediaArtworkDefaultProvider } from '@tahti-player/ui';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    imageReveal: { control: 'boolean' },
    surface: {
      control: 'inline-radio',
      options: ['brand', 'neutral'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const cover = 'https://picsum.photos/300';

export const Default: Story = {
  args: {
    src: cover,
    title: 'Random Album',
    subtitle: 'Some Artist',
    surface: 'brand',
  },
};

export const NeutralSurface: Story = {
  args: {
    src: cover,
    title: 'Random Album',
    subtitle: 'Some Artist',
    surface: 'neutral',
  },
};

export const WithLongText: Story = {
  args: {
    src: cover,
    title:
      'An Incredibly, Ridiculously Long Album Title That Should Truncate Nicely',
    subtitle:
      'A Very Long Artist Name Featuring Another Artist With Even More Characters',
  },
};

export const WithoutText: Story = {
  args: {
    src: cover,
  },
};

export const WithoutSubtitle: Story = {
  args: {
    src: cover,
    title: "Joe's Garage",
  },
};

export const WithoutImage: Story = {
  args: {
    src: '',
    title: 'No Image',
    subtitle: 'Some Artist',
  },
};

const DEFAULT_ARTWORK = '/artwork-presets/artwork-05.webp';

export const BrokenCoverShowsDefaultArtwork: Story = {
  args: {
    src: 'https://cdn.tahti.invalid/collections/sets/cover-expired.png',
    seed: 'sets',
    title: 'Sets',
    subtitle: '6 items · Featured',
  },
  decorators: [
    (Story) => (
      <MediaArtworkDefaultProvider value={() => DEFAULT_ARTWORK}>
        <div style={{ width: 200 }}>
          <Story />
        </div>
      </MediaArtworkDefaultProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: 'Sets' })).toHaveAttribute(
        'src',
        DEFAULT_ARTWORK,
      ),
    );
    await expect(
      canvasElement.querySelector('[data-testid="media-artwork-fallback"]'),
    ).toBeNull();
  },
};

export const WithoutReveal: Story = {
  args: {
    src: cover,
    title: 'Random Album',
    subtitle: 'Some Artist',
    imageReveal: false,
  },
};

export const WithAmbientGlow: Story = {
  args: {
    src: cover,
    title: 'Ambient wash (grid technique)',
    subtitle: 'See AmbientCard for per-card glass',
  },
  decorators: [
    (Story) => (
      <div className="relative p-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden
        >
          <img
            src={cover}
            alt=""
            className="absolute top-1/4 left-1/4 size-56 rounded-full object-cover opacity-40 blur-3xl saturate-150"
          />
          <img
            src={cover}
            alt=""
            className="absolute right-1/4 bottom-1/4 size-48 rounded-full object-cover opacity-30 blur-3xl saturate-150"
          />
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Opaque Card chrome cannot host a per-card blur bleed. Use `AmbientCard` for glass + cover-ambient chrome; DirectoryArtistCardGrid still paints a soft collage behind the whole grid.',
      },
    },
  },
};

export const Playing: Story = {
  args: { ...NeutralSurface.args, isPlaying: true, onPlay: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('card')).toHaveAttribute(
      'data-playing',
      'true',
    );
    await expect(
      canvas.getByRole('button', { name: 'Pause Random Album', exact: true }),
    ).toBeVisible();
  },
};
