import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStatusView } from '@tahti-web/views/admin/AdminStatusView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof AdminStatusView> = {
  title: 'Tahti/Admin/AdminStatusView',
  component: AdminStatusView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/status'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStatusView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Status checks' }),
      ).toBeVisible(),
    );
    await expect(canvas.getByText('postgres')).toBeVisible();
    await expect(canvas.getByText('live-streams')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Media queue jobs' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Workers' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getAllByRole('button', { name: 'History' })[0]!,
    );
    await findDialog(canvasElement);
  },
};
