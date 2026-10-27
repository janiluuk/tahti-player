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
    await expect(
      within(canvasElement).getByRole('tablist', { name: 'Studio pages' }),
    ).toBeVisible();
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

export const ManageRadioActive: Story = {
  args: { current: '/studio/channel?tab=radio', global: true },
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

const expectNestedTabs = async (
  canvasElement: HTMLElement,
  label: string,
  selected: string,
) => {
  const nested = canvasElement.querySelector<HTMLElement>(
    '[data-studio-nested-nav]',
  );
  await expect(nested).not.toBeNull();
  const list = within(nested!).getByRole('tablist', { name: label });
  await expect(
    within(list).getByRole('tab', { name: selected, selected: true }),
  ).toBeVisible();
};

export const StatsSubtabs: Story = {
  args: { current: '/studio/stats?tab=plays', global: true },
  decorators: [withTahtiRouter('/studio/stats?tab=plays')],
  play: async ({ canvasElement }) => {
    await expectNestedTabs(canvasElement, 'Stats pages', 'Plays & listeners');
  },
};

export const GovernanceSubtabs: Story = {
  args: { current: '/studio/governance?tab=documents', global: true },
  decorators: [withTahtiRouter('/studio/governance?tab=documents')],
  play: async ({ canvasElement }) => {
    await expectNestedTabs(canvasElement, 'Governance pages', 'Documents');
  },
};

export const PostsSubtabs: Story = {
  args: { current: '/studio/updates', global: true },
  decorators: [withTahtiRouter('/studio/updates')],
  play: async ({ canvasElement }) => {
    await expectNestedTabs(canvasElement, 'Posts pages', 'Posts');
  },
};
