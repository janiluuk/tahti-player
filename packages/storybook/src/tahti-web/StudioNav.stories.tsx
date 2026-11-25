import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioNav } from '@tahti-web/components/StudioNav';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioNav> = {
  title: 'Tahti/Studio/StudioNav',
  component: StudioNav,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  args: { current: '/studio', global: true },
  play: async ({ canvasElement }) => {
    const studio = within(canvasElement).getByRole('navigation', {
      name: 'Studio pages',
    });
    await expect(studio).toBeVisible();
    await expect(within(canvasElement).queryByRole('tablist')).toBeNull();
    await expect(
      within(studio).getByRole('link', { name: 'Home' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      canvasElement.querySelector('[data-studio-nested-nav]'),
    ).toBeNull();
  },
};

export const PerformActive: Story = {
  args: { current: '/studio/schedule', global: true },
};

export const LibraryActive: Story = {
  args: { current: '/library', global: true },
};

export const GrowActive: Story = {
  args: { current: '/studio/insights/archive/1', global: true },
};

export const ManageActive: Story = {
  args: { current: '/studio/channel/radio', global: true },
  decorators: [withTahtiRouter('/studio/channel/radio')],
};

/** Broadcast pages get a second row: three quiet filled links, the current
 * one marked with `aria-current="page"`. */
export const BroadcastSubNav: Story = {
  args: { current: '/studio/schedule?show=events', global: true },
  decorators: [withTahtiRouter('/studio/schedule?show=events')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const broadcast = canvas.getByRole('navigation', {
      name: 'Broadcast pages',
    });
    const links = within(broadcast).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([
      'Go live',
      'Schedule',
      'Shows',
    ]);
    const schedule = within(broadcast).getByRole('link', { name: 'Schedule' });
    await expect(schedule).toHaveAttribute('aria-current', 'page');
    await expect(schedule).toHaveClass('bg-background-input');
    await expect(schedule).not.toHaveClass('bg-primary');
    await expect(
      within(
        canvas.getByRole('navigation', { name: 'Studio pages' }),
      ).getByRole('link', { name: 'Broadcast' }),
    ).toHaveAttribute('aria-current', 'page');
  },
};

/** Channel is its own Studio tab; its pages share the same filled row. */
export const ChannelSubNav: Story = {
  args: { current: '/studio/channel/visibility', global: true },
  decorators: [withTahtiRouter('/studio/channel/visibility')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const channel = canvas.getByRole('navigation', { name: 'Channel pages' });
    await expect(
      within(channel)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Design', 'Radio', 'Settings', 'Visibility', 'Address']);
    await expect(
      within(channel).getByRole('link', { name: 'Visibility' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      within(
        canvas.getByRole('navigation', { name: 'Studio pages' }),
      ).getByRole('link', { name: 'Channel' }),
    ).toHaveAttribute('aria-current', 'page');
  },
};

/** Profile pages: five tabs, mostly-empty forms merged into their
 * neighbours. */
export const ProfileSubNav: Story = {
  args: { current: '/studio/profile/identity', global: true },
  decorators: [withTahtiRouter('/studio/profile/identity')],
  play: async ({ canvasElement }) => {
    const profile = within(canvasElement).getByRole('navigation', {
      name: 'Profile pages',
    });
    await expect(
      within(profile)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Identity',
      'Links',
      'Link page',
      'Branding',
      'Gallery & press kit',
    ]);
  },
};

export const StripeActive: Story = {
  args: { current: '/studio/stripe', global: true },
  decorators: [withTahtiRouter('/studio/stripe')],
};

export const ManageSourcesActive: Story = {
  args: { current: '/settings/plugin-store', global: true },
  decorators: [withTahtiRouter('/settings/plugin-store')],
};

export const NoCurrentRoute: Story = {
  args: { global: true },
};

export const NestedPerformRoute: Story = {
  args: { current: '/studio/shows/weekly-session', global: true },
  decorators: [withTahtiRouter('/studio/shows/weekly-session')],
};

export const MobileOverflow: Story = {
  args: { current: '/studio/channel/radio', global: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

// Stats and Governance pick their sections from in-page chips, so Studio
// adds no nested tab strip under them.
const expectNoNestedTabs = async (canvasElement: HTMLElement) => {
  await expect(
    canvasElement.querySelector('[data-studio-nested-nav]'),
  ).toBeNull();
};

export const StatsSubtabs: Story = {
  args: { current: '/studio/stats?tab=plays', global: true },
  decorators: [withTahtiRouter('/studio/stats?tab=plays')],
  play: async ({ canvasElement }) => {
    await expectNoNestedTabs(canvasElement);
  },
};

export const FansPageBackLink: Story = {
  args: { current: '/studio/updates', global: true },
  decorators: [withTahtiRouter('/studio/updates')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Fans' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByTestId('studio-fans-back')).toHaveAttribute(
      'href',
      '/studio/fans',
    );
  },
};

/** Tracks and Collections are Music chips next to Releases, and Upload keeps
 * Tracks lit. */
export const MusicCatalogChips: Story = {
  args: { current: '/studio/upload', global: true },
  decorators: [withTahtiRouter('/studio/upload')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      within(
        canvas.getByRole('navigation', { name: 'Studio pages' }),
      ).getByRole('link', { name: 'Music' }),
    ).toHaveAttribute('aria-current', 'page');
    const music = canvas.getByRole('navigation', { name: 'Music pages' });
    await expect(
      within(music)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Tracks',
      'Releases',
      'Collections',
      'Distribution',
      'Editor',
      'Groups',
    ]);
    await expect(
      within(music).getByRole('link', { name: 'Tracks' }),
    ).toHaveAttribute('aria-current', 'page');
  },
};

/** Recordings opens from a Broadcast hub card, so it links back to the hub
 * instead of showing the Broadcast chips. */
export const RecordingsBackLink: Story = {
  args: { current: '/studio/recordings', global: true },
  decorators: [withTahtiRouter('/studio/recordings')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('navigation', { name: 'Broadcast pages' }),
    ).toBeNull();
    await expect(canvas.getByTestId('studio-broadcast-back')).toHaveAttribute(
      'href',
      '/studio/broadcast',
    );
  },
};
