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

export const Default: Story = {
  args: {
    current: '/admin',
  },
  play: async ({ canvasElement }) => {
    const pages = await expectSelected(canvasElement, 'Overview', 'Dashboard');
    for (const name of ['Financial', 'Storage', 'Logs', 'Status', 'Vendors']) {
      await expect(pages.getByRole('tab', { name })).toBeVisible();
    }
  },
};

export const ModerationActive: Story = {
  args: {
    current: '/admin/moderation',
  },
  play: async ({ canvasElement }) => {
    const pages = await expectSelected(
      canvasElement,
      'Community',
      'Moderation',
    );
    await expect(pages.getByRole('tab', { name: 'Users' })).toBeVisible();
    await expect(pages.getByRole('tab', { name: 'Governance' })).toBeVisible();
  },
};

export const NestedModerationRoute: Story = {
  args: {
    current: '/admin/moderation/feature-requests',
  },
  decorators: [withTahtiRouter('/admin/moderation/feature-requests')],
  play: async ({ canvasElement }) => {
    await expectSelected(canvasElement, 'Community', 'Moderation');
  },
};

/** The pending moderation count rides on the Moderation tab. */
export const ModerationPendingCount: Story = {
  args: {
    current: '/admin/users',
    moderationPendingCount: 7,
  },
  play: async ({ canvasElement }) => {
    const pages = await expectSelected(canvasElement, 'Community', 'Users');
    await expect(
      pages.getByRole('tab', { name: /Moderation/ }),
    ).toHaveTextContent('7');
  },
};

export const MobileModeration: Story = {
  args: {
    current: '/admin/moderation/missed-shows',
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [withTahtiRouter('/admin/moderation/missed-shows')],
  play: async ({ canvasElement }) => {
    await expectSelected(canvasElement, 'Community', 'Moderation');
  },
};
