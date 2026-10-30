import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminFinancialView } from '@tahti-web/views/admin/AdminFinancialView';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminFinancialView> = {
  title: 'Tahti/Admin/AdminFinancialView',
  component: AdminFinancialView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/financial'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminFinancialView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', {
          name: 'Fan subscriptions by artist',
        }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Payout queue' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        canvas.getByRole('button', {
          name: 'Retry payout to DJ Moonlight',
        }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Legacy membership migration' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Ledger entries' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Add entry' }),
    ).toBeVisible();
  },
};
