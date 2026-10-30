import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLogsView } from '@tahti-web/views/admin/AdminLogsView';
import { expect, waitFor, within } from 'storybook/test';

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
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Logs' })).toBeVisible(),
    );
    await expect(
      canvas.getByRole('tab', { name: 'Audit events' }),
    ).toHaveAttribute('aria-selected', 'true');
    const entry = await canvas.findByText('Nova Drift logged in');
    await waitFor(() => expect(entry).toBeVisible());
    await selectTab(canvas, 'Container logs');
  },
};
