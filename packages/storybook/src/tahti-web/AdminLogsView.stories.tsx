import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLogsView } from '@tahti-web/views/admin/AdminLogsView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof AdminLogsView> = {
  title: 'Tahti/Admin/AdminLogsView',
  component: AdminLogsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/logs'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminLogsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Logs' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('tab', { name: 'Audit events' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(await canvas.findByText('Nova Drift logged in')).toBeVisible();
    await selectTab(canvas, 'Container logs');
  },
};
