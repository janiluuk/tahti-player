import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EmbedChannelView,
  EmbedCollectionView,
  EmbedReleaseView,
} from '@tahti-web/views/EmbedViews';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof EmbedChannelView> = {
  title: 'Tahti/Media/EmbedViews',
  component: EmbedChannelView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Chromeless iframe pages for third-party sites: `/embed/c/$slug`, `/embed/r/$id` and `/embed/col/$slug`. Each wraps its content in `<main>` above the connected player bar.',
      },
    },
  },
  args: { slug: 'aurora-unit' },
  decorators: [withTahtiRouter('/embed/c/aurora-unit')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmbedChannel: Story = {
  parameters: {
    mockData: mockData({
      channel: (base) => ({
        ...base,
        state: 'LIVE',
        hlsUrl: 'https://stream.tahti.live/aurora-unit/live.m3u8',
        user: {
          ...base.user,
          displayName: 'Aurora Unit',
          username: 'aurora-unit',
        },
      }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = await canvas.findByRole('main');
    const scope = within(main);
    await expect(
      await scope.findByRole('heading', { name: 'Aurora Unit', level: 1 }),
    ).toBeVisible();
    await expect(scope.getByText(/@aurora-unit — LIVE/)).toBeVisible();
    await expect(scope.getByRole('button', { name: 'Play' })).toBeVisible();
  },
};

export const EmbedChannelOffline: Story = {
  name: 'Embed Channel (offline)',
  parameters: {
    mockData: mockData({
      channel: (base) => ({
        ...base,
        state: 'OFFLINE',
        hlsUrl: null,
        user: {
          ...base.user,
          displayName: 'Aurora Unit',
          username: 'aurora-unit',
        },
      }),
    }),
  },
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole('main'));
    await expect(
      await main.findByRole('heading', { name: 'Aurora Unit', level: 1 }),
    ).toBeVisible();
    await expect(
      main.getByRole('link', { name: /Open channel/ }),
    ).toBeVisible();
    await expect(main.queryByRole('button', { name: 'Play' })).toBeNull();
  },
};

export const EmbedChannelError: Story = {
  name: 'Embed Channel (load error)',
  parameters: {
    mockData: mockData({
      channel: () => {
        throw new Error('Channel not found');
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole('main'));
    await expect(
      await main.findByText('Could not load this embed'),
    ).toBeVisible();
    await expect(main.getByText('Channel not found')).toBeVisible();
  },
};

export const EmbedRelease: StoryObj<typeof EmbedReleaseView> = {
  render: () => <EmbedReleaseView id="night-drive-ep" />,
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole('main'));
    await expect(
      await main.findByRole('heading', { name: 'Mock release', level: 1 }),
    ).toBeVisible();
    const tracks = main.getByRole('list');
    await expect(within(tracks).getAllByRole('listitem')).toHaveLength(2);
    await expect(within(tracks).getByText('1. Track one')).toBeVisible();
    await expect(
      main.getByRole('link', { name: /Open smart link/ }),
    ).toBeVisible();
  },
};

export const EmbedCollection: StoryObj<typeof EmbedCollectionView> = {
  parameters: {
    mockData: mockData({ collection: { name: 'Night Shift Swaps' } }),
  },
  render: () => <EmbedCollectionView slug="northern-lights-favorites-vault" />,
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole('main'));
    await expect(
      await main.findByRole('heading', {
        name: 'Night Shift Swaps',
        level: 1,
      }),
    ).toBeVisible();
    const tracks = main.getByRole('list');
    await expect(
      within(tracks).getAllByRole('listitem').length,
    ).toBeGreaterThanOrEqual(2);
    await expect(main.getByRole('button', { name: 'Queue' })).toBeVisible();
    await expect(
      main.getByRole('link', { name: /Open collection/ }),
    ).toBeVisible();
  },
};
