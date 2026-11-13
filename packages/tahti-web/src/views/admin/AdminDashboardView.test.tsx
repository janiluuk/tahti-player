// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminDashboardView } from './AdminDashboardView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-nav">{children}</div>
  ),
}));

describe('AdminDashboardView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the dashboard failure with Retry instead of an endless loader', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAdminDashboard')
      .mockRejectedValueOnce(new Error('HTTP 503'));
    await renderWithRouter(<AdminDashboardView />);

    expect(screen.getByTestId('admin-nav')).toBeTruthy();
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent,
    ).toContain('Dashboard');
    expect(await screen.findByText("Couldn't load the dashboard")).toBeTruthy();
    expect(screen.getByText('HTTP 503')).toBeTruthy();
    expect(screen.queryByText('Loading dashboard…')).toBeNull();

    fetch.mockImplementation(() => new Promise(() => undefined));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Loading dashboard…')).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('leads with community stats, then system health and the status links', async () => {
    vi.spyOn(admin, 'fetchAdminDashboard').mockResolvedValue({
      data: {
        kpis: { activeMembers: 3, liveNow: 0, betaQueue: 1, openTickets: 2 },
        actionRows: [],
        health: {
          icecast: 'up',
          minio: 'up',
          postgresBackupAgeHours: 4,
          failedFanSubPayouts: 0,
        },
        financeYtdCents: { surplus: 0, revenue: 0, costs: 0 },
        liveStreams: [],
        queues: [],
        cronJobs: [],
        audit: [],
      },
      meta: { source: 'api' },
    } as never);
    await renderWithRouter(<AdminDashboardView />, {
      paths: ['/admin/status', '/admin/monitoring', '/admin/logs'],
    });
    const headings = (await screen.findAllByRole('heading', { level: 2 })).map(
      (heading) => heading.textContent,
    );
    expect(headings[0]).toBe('Chat and mail');
    expect(headings).toContain('System health');
    expect(screen.getByRole('link', { name: 'Status checks' })).toHaveAttribute(
      'href',
      '/admin/status',
    );
    expect(screen.getByRole('link', { name: 'View logs' })).toHaveAttribute(
      'href',
      '/admin/logs',
    );
  });
});
