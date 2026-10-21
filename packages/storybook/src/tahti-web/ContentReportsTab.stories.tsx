import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentReportsTab } from '@tahti-web/views/admin/moderation/tabs/ContentReportsTab';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ContentReportsTab> = {
  title: 'Tahti/Admin/ContentReportsTab',
  component: ContentReportsTab,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Admin → Moderation → Content reports. Each row links to the reported page by its title, quotes a reported comment and says when the reported item has been removed.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/admin/moderation/content-reports'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Open reports: a track with a link to its page and a quoted comment. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = await canvas.findByRole('link', { name: 'Night Drive' });
    await expect(track).toHaveAttribute('href', '/t/arch-sub-1');
    await expect(
      canvas.getByRole('link', { name: 'Comment by @aurora-fan' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Nobody wants to hear this, quit already.'),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: /Mark actioned/ }).length,
    ).toBeGreaterThan(0);
  },
};

/** All statuses, including a report whose target has since been removed. */
export const All: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Night Drive' });
    await userEvent.click(canvas.getByRole('tab', { name: /All/ }));
    await waitFor(() =>
      expect(
        canvas.getByText('The reported item has been removed.'),
      ).toBeVisible(),
    );
    await expect(canvas.getByText(/Actioned by/)).toBeVisible();
  },
};
