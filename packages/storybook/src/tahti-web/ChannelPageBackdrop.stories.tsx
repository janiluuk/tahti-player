import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelPageBackdrop } from '@tahti-web/components/channel-view';
import { normalizeColorScheme } from '@tahti-web/lib/colorScheme';
import { expect } from 'storybook/test';

import { storyChannel } from './_fixtures/channel';

// Header backdrops must be https image URLs (HEADER_IMAGE_URL_PATTERN).
const BACKDROP_IMAGE = 'https://cdn.tahti.live/backdrops/northern-lights.jpg';

const meta: Meta<typeof ChannelPageBackdrop> = {
  title: 'Tahti/Channel/ChannelPageBackdrop',
  component: ChannelPageBackdrop,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The full-bleed ambient layer behind the public channel page. A chosen background visualizer wins; otherwise, when the hero block is hidden, the header's video, image, solid colour or gradient moves here.",
      },
    },
  },
  args: {
    channel: storyChannel({
      headerStyle: 'GRADIENT',
      colorScheme: {
        accent: '#7C3AED',
        highlight: '#22D3EE',
        bg: '#0B1220',
        text: '#F8FAFC',
        muted: '#64748B',
      },
    }),
    pageScheme: normalizeColorScheme(null),
    backgroundVisualPreset: null,
    heroVisible: false,
    live: false,
    channelVideoMuted: true,
  },
  render: (args) => (
    <div className="relative h-72 overflow-hidden" data-testid="story-page">
      <ChannelPageBackdrop {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

function backdropLayer(canvasElement: HTMLElement) {
  return canvasElement.querySelector<HTMLElement>(
    '[data-testid="story-page"] > *',
  );
}

export const Gradient: Story = {
  play: async ({ canvasElement }) => {
    const layer = backdropLayer(canvasElement);
    await expect(layer?.style.backgroundImage).toMatch(
      /linear-gradient\(135deg, (#0B1220|rgb\(11, 18, 32\))/i,
    );
  },
};

export const Solid: Story = {
  args: {
    channel: storyChannel({
      headerStyle: 'SOLID',
      colorScheme: {
        accent: '#7C3AED',
        highlight: '#22D3EE',
        bg: '#112233',
        text: '#F8FAFC',
        muted: '#64748B',
      },
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(backdropLayer(canvasElement)?.style.backgroundColor).toBe(
      'rgb(17, 34, 51)',
    );
  },
};

export const ImageBackdrop: Story = {
  args: {
    live: true,
    channel: storyChannel({
      headerStyle: 'VIDEO_LOOP',
      videoBackgroundUrl: BACKDROP_IMAGE,
    }),
  },
  play: async ({ canvasElement }) => {
    const layer = backdropLayer(canvasElement);
    await expect(layer?.tagName).toBe('IMG');
    await expect(layer).toHaveAttribute('src', BACKDROP_IMAGE);
    await expect(layer).toHaveClass('opacity-[0.32]');
  },
};

export const HeroCarriesTheHeader: Story = {
  args: { heroVisible: true },
  play: async ({ canvasElement }) => {
    await expect(backdropLayer(canvasElement)).toBeNull();
  },
};
