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
  args: { current: '/studio/channel', global: true },
};

/** Broadcast pages get a second row: four quiet filled links, the current
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
      'Channel',
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
  args: { current: '/studio/channel', global: true },
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

export const GovernanceSubtabs: Story = {
  args: { current: '/studio/governance?tab=documents', global: true },
  decorators: [withTahtiRouter('/studio/governance?tab=documents')],
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
