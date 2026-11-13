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
      expect(
        canvas.getByRole('heading', { name: 'Monitoring' }),
      ).toBeInTheDocument(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Grafana dashboards' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('heading', { name: 'Vital services (Grafana)' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTitle('Tahti vital services — Grafana'),
    ).toBeInTheDocument();
    await expect(canvas.getByText('API')).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Full logs page' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getAllByRole('link', { name: 'App logs' }).length,
    ).toBeGreaterThan(0);
    await expect(
      canvas.queryByRole('heading', {
        name: 'Container logs (all services)',
      }),
    ).toBeNull();
  },
};
