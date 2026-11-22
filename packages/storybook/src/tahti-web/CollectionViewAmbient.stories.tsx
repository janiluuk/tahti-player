import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PublicCollection } from '@tahti-web/api/types';
import { CollectionView } from '@tahti-web/views/CollectionView';
import { expect, waitFor, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const SLUG = 'warm-evenings';
const NAME = 'Warm Evenings';

/** 4×4 solid PNGs, same-origin readable so the dominant colour samples. */
const ORANGE_COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGN4USoFRwzEcQBukhdxzkT4pAAAAABJRU5ErkJggg==';
const ORANGE = 'rgb(232, 117, 26)';
const BLUE_TRACK_COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGPQSDgBRwzEcQAYUhUBVFs1iAAAAABJRU5ErkJggg==';
const BLUE = 'rgb(40, 96, 200)';

function collection(
  base: PublicCollection,
  coverUrl: string | null,
  trackCover: string | null,
): PublicCollection {
  return {
    ...base,
    slug: SLUG,
    name: NAME,
    coverUrl,
    items: base.items.map((item, index) =>
      item.sound
        ? {
            ...item,
            sound: {
              ...item.sound,
              bannerUrl: index === 1 ? trackCover : null,
            },
          }
        : item,
    ),
  };
}

const meta: Meta<typeof CollectionView> = {
  title: 'Tahti/Collection/CollectionViewAmbient',
  component: CollectionView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Playlist header tint: the collection cover, else the first track with its own cover, else none (never the generated placeholder). The colour is a soft low-alpha wash (`coverWash`, at most 30% alpha) over the theme surface; the header keeps the theme background and text tokens, so it reads in dark and light mode. Shown in dark mode.',
      },
    },
  },
  args: { slug: SLUG },
  globals: { themeId: 'nuclear:default', themeMode: 'dark' },
  decorators: [
    withPageSurface(),
    withTahtiRouter(`/u/northern-lights/c/${SLUG}`),
    withMockAuth(MOCK_USERS.listener),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Any CSS colour as sRGB 0-255 plus alpha, via a 1×1 canvas. */
function toRgba(color: string): [number, number, number, number] {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!, a! / 255];
}

function luminance(color: string): number {
  const [r, g, b] = toRgba(color)
    .slice(0, 3)
    .map((part) => {
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

async function findHeader(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findByRole('heading', { level: 1, name: NAME });
  return canvas.getByTestId('collection-social-header');
}

/** The header sits on the theme surface (not the raw colour) and its title
 * reads on it. */
async function expectThemeSurface(header: HTMLElement, raw?: string) {
  const background = getComputedStyle(header).backgroundColor;
  if (raw) {
    await expect(background).not.toBe(raw);
  }
  const probe = document.createElement('div');
  probe.className = 'bg-background-secondary';
  header.parentElement!.append(probe);
  const themeSurface = getComputedStyle(probe).backgroundColor;
  probe.remove();
  await expect(background).toBe(themeSurface);
  const title = within(header).getByRole('heading', { level: 1 });
  await expect(
    contrast(getComputedStyle(title).color, background),
  ).toBeGreaterThanOrEqual(4.5);
}

export const WarmCover: Story = {
  parameters: {
    mockData: mockData({
      collection: (base) => collection(base, ORANGE_COVER, BLUE_TRACK_COVER),
    }),
  },
  play: async ({ canvasElement }) => {
    const header = await findHeader(canvasElement);
    const wash = await within(header).findByTestId(
      'entity-social-header-wash',
      {},
      { timeout: 5000 },
    );
    await expect(wash.style.backgroundImage).toContain(
      'rgba(232, 117, 26, 0.3)',
    );
    await expectThemeSurface(header, ORANGE);
  },
};

export const TrackCoverOnly: Story = {
  parameters: {
    mockData: mockData({
      collection: (base) => collection(base, null, BLUE_TRACK_COVER),
    }),
  },
  play: async ({ canvasElement }) => {
    const header = await findHeader(canvasElement);
    const wash = await within(header).findByTestId(
      'entity-social-header-wash',
      {},
      { timeout: 5000 },
    );
    await expect(wash.style.backgroundImage).toContain(
      'rgba(40, 96, 200, 0.3)',
    );
    await expectThemeSurface(header, BLUE);
  },
};

export const NoArtwork: Story = {
  parameters: {
    mockData: mockData({
      collection: (base) => collection(base, null, null),
    }),
  },
  play: async ({ canvasElement }) => {
    const header = await findHeader(canvasElement);
    await waitFor(() =>
      expect(
        within(header).queryByTestId('entity-social-header-wash'),
      ).toBeNull(),
    );
    await expectThemeSurface(header);
  },
};
