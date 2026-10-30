import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminMonitoringView } from '@tahti-web/views/admin/AdminMonitoringView';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminMonitoringView> = {
  title: 'Tahti/Admin/AdminMonitoringView',
  component: AdminMonitoringView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/monitoring'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminMonitoringView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Monitoring' })).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Grafana dashboards' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Vital services (Grafana)' }),
    ).toBeVisible();
    await expect(
      canvas.getByTitle('Tahti vital services — Grafana'),
    ).toBeVisible();
    await expect(canvas.getByText('API')).toBeVisible();
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', {
          name: 'Container logs (all services)',
        }),
      ).toBeVisible(),
    );
  },
};
