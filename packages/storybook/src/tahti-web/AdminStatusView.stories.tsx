import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStatusView } from '@tahti-web/views/admin/AdminStatusView';
import { expect, userEvent, within } from 'storybook/test';

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
    await expect(
      await canvas.findByRole('heading', { name: 'Cron jobs' }),
    ).toBeVisible();
    await expect(canvas.getByText('postgres')).toBeVisible();
    await expect(
      canvas.getByText('1 of 2 offline (no heartbeat recently).'),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'nightly-backup run history' }),
    );
    await findDialog(canvasElement);
  },
};
