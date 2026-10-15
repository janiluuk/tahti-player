import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelView } from '@tahti-web/views/ChannelView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ChannelView> = {
  title: 'Tahti/Channel/ChannelView',
  component: ChannelView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The public channel page, assembled from the eight Channel Designer blocks (`hero`, `actions`, `archive`, `chat`, `about`, `links`, `textOverlay`, `subscribe` — see `../lib/channelPageLayout.ts`). Each block is rendered by `ChannelView`’s own `renderBlock` switch, not a standalone component per block.',
      },
    },
  },
  args: { slug: 'northern-lights' },
  decorators: [withTahtiRouter('/channel/northern-lights')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Visitor: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

// Signed in as the channel owner. Click "Edit design" in the header to open
// the live Channel Designer layout editor (add/reorder/show-hide for all
// eight blocks, including the Subscribe CTA).
export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
};

/** Any CSS colour (rgb, oklch, …) as sRGB 0-255, via a 1×1 canvas. */
function toRgb(color: string): [number, number, number] {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!];
}

function luminance(color: string): number {
  const [r, g, b] = toRgb(color).map((part) => {
    const channel = part / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

function toRgbaAlpha(color: string): number {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data[3]! / 255;
}

/** The first opaque background behind `element`. */
function surfaceOf(element: Element): string {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const background = getComputedStyle(node).backgroundColor;
    if (toRgbaAlpha(background) > 0.99) {
      return background;
    }
  }
  return getComputedStyle(document.body).backgroundColor;
}

/** Track titles keep the theme's text colour on the theme's table, whatever the channel's own colour scheme paints around them. */
async function expectReadableTrackTitles(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const rows = await canvas.findAllByTestId('track-row', {}, { timeout: 5000 });
  for (const row of rows) {
    const text = row.querySelector('td button.text-left') ?? row;
    const ratio = contrast(getComputedStyle(text).color, surfaceOf(text));
    await expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
}

/** Light mode (Aurora): the channel scheme is dark, the theme's surfaces light. */
export const LightTheme: Story = {
  globals: { themeId: 'nuclear:aurora', themeMode: 'light' },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => expectReadableTrackTitles(canvasElement),
};

/** Dark mode, same check. */
export const DarkTheme: Story = {
  globals: { themeId: 'nuclear:default', themeMode: 'dark' },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => expectReadableTrackTitles(canvasElement),
};

/** A phone in light mode. */
export const PhoneLightTheme: Story = {
  globals: { themeId: 'nuclear:aurora', themeMode: 'light' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => expectReadableTrackTitles(canvasElement),
};
