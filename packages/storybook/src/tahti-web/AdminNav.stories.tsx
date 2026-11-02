import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminNav } from '@tahti-web/components/AdminNav';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

async function expectSelected(
  canvasElement: HTMLElement,
  section: string,
  page: string,
) {
  const canvas = within(canvasElement);
  const sections = canvas.getByRole('tablist', { name: 'Admin sections' });
  await expect(
    within(sections).getByRole('tab', { name: section }),
  ).toHaveAttribute('aria-selected', 'true');
  const pages = canvas.getByRole('tablist', { name: `Admin ${section}` });
  await expect(within(pages).getByRole('tab', { name: page })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  return within(pages);
}

const meta: Meta<typeof AdminNav> = {
  title: 'Tahti/Admin/AdminNav',
  component: AdminNav,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin')],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function expectSection(canvasElement: HTMLElement, section: string) {
  const canvas = within(canvasElement);
  const sections = canvas.getByRole('tablist', { name: 'Admin sections' });
  await expect(
    within(sections).getByRole('tab', { name: new RegExp(`^${section}`) }),
  ).toHaveAttribute('aria-selected', 'true');
  return canvas;
}

export const Default: Story = {
  args: {
    current: '/admin',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sections = within(
      canvas.getByRole('tablist', { name: 'Admin sections' }),
    ).getAllByRole('tab');
    await expect(sections.map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Inbox',
      'People',
      'Content',
      'Co-op',
      'Platform',
    ]);
    const pages = await expectSelected(canvasElement, 'Overview', 'Dashboard');
    for (const name of ['Status', 'Monitoring']) {
      await expect(pages.getByRole('tab', { name })).toBeVisible();
    }
  },
};

/** Inbox is one page: no second row of tabs. */
export const InboxActive: Story = {
  args: {
    current: '/admin/moderation',
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectSection(canvasElement, 'Inbox');
    await expect(
      canvas.queryByRole('tablist', { name: 'Admin Inbox' }),
    ).toBeNull();
  },
};

export const NestedInboxRoute: Story = {
  args: {
    current: '/admin/moderation/feature-requests',
  },
  decorators: [withTahtiRouter('/admin/moderation/feature-requests')],
  play: async ({ canvasElement }) => {
    await expectSection(canvasElement, 'Inbox');
  },
};

/** The pending review count rides on the Inbox section tab. */
export const InboxPendingCount: Story = {
  args: {
    current: '/admin/users',
    moderationPendingCount: 7,
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectSection(canvasElement, 'People');
    await expect(canvas.getByTestId('admin-inbox-count')).toHaveTextContent(
      '7',
    );
  },
};

/** A hub section's page shows a back link to the hub, not a tab row. */
export const PlatformHubChild: Story = {
  args: {
    current: '/admin/addons',
  },
  decorators: [withTahtiRouter('/admin/addons')],
  play: async ({ canvasElement }) => {
    const canvas = await expectSection(canvasElement, 'Platform');
    await expect(canvas.getByTestId('admin-hub-back')).toHaveAttribute(
      'href',
      '/admin/hubs/platform',
    );
  },
};

export const MobileInbox: Story = {
  args: {
    current: '/admin/moderation/missed-shows',
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [withTahtiRouter('/admin/moderation/missed-shows')],
  play: async ({ canvasElement }) => {
    await expectSection(canvasElement, 'Inbox');
  },
};
