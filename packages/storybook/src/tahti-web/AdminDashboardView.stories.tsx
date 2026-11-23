import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminDashboardView } from '@tahti-web/views/admin/AdminDashboardView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { stubGrafanaHealth } from './_lib/grafana';

const meta: Meta<typeof AdminDashboardView> = {
  title: 'Tahti/Admin/AdminDashboardView',
  component: AdminDashboardView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminDashboardView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'System health' }),
      ).toBeVisible(),
    );
    await expect(canvas.getByRole('tab', { name: 'Health' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.getByRole('tab', { name: /^Jobs/ })).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Monitoring' })).toBeVisible();
    await expect(canvas.getByText(/active members/i)).toBeVisible();
    await expect(canvas.getByText('Fan-sub payouts')).toBeVisible();
    const live = canvas.getByRole('list', { name: 'Live now (3)' });
    await expect(within(live).getByText('Northern Lights')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Status checks' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('heading', { name: 'Cron jobs' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('heading', { name: 'Grafana dashboards' }),
    ).not.toBeInTheDocument();
  },
};

export const JobsTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminDashboardView tab="jobs" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const queues = await canvas.findByRole('list', { name: 'Queue health' });
    await expect(canvas.getByRole('tab', { name: /^Jobs/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(within(queues).getByText('1 failed')).toBeVisible();
    const rows = canvas.getAllByTestId('cron-job-row');
    await expect(rows).toHaveLength(4);
    await expect(within(rows[3]!).getByText('Not run yet')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Workers' }),
    ).toBeInTheDocument();
    await userEvent.click(rows[1]!);
    await waitFor(() =>
      expect(within(document.body).getByRole('dialog')).toBeVisible(),
    );
  },
};

export const MonitoringTab: Story = {
  beforeEach: () => stubGrafanaHealth(true),
  render: () => (
    <div className="p-6">
      <AdminDashboardView tab="monitoring" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Grafana dashboards' }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('tab', { name: 'Monitoring' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      canvas.getByTitle('Tahti vital services — Grafana'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Full logs page' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('heading', { name: 'System health' }),
    ).not.toBeInTheDocument();
  },
};

export const MonitoringGrafanaUnreachable: Story = {
  beforeEach: () => stubGrafanaHealth(false),
  render: () => (
    <div className="p-6">
      <AdminDashboardView tab="monitoring" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fallback = await canvas.findByTestId('grafana-embed-fallback');
    await expect(fallback).toHaveTextContent(/did not answer/);
    await expect(
      within(fallback).getByRole('link', { name: /Open Grafana/ }),
    ).toHaveAttribute('href', expect.stringContaining('grafana.tahti.live'));
  },
};

export const ActivityTab: Story = {
  render: () => (
    <div className="p-6">
      <AdminDashboardView tab="activity" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Needs action' }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('tab', { name: /^Activity/ }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('link', { name: 'Approve' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Verify' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Retry' })).toBeVisible();
  },
};
