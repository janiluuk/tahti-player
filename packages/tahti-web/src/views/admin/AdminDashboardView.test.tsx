// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import * as client from '../../api/client';
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

function mockDashboard() {
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
      liveStreams: [
        {
          slug: 'northern-lights',
          artistName: 'Northern Lights',
          elapsedSec: 5400,
        },
      ],
      queues: [
        { name: 'transcode', waiting: 2, failed: 0 },
        { name: 'email', waiting: 0, failed: 3 },
      ],
      cronJobs: [
        {
          jobName: 'nightly-backup',
          description: 'Postgres dump',
          pattern: '0 3 * * *',
          lastRun: {
            outcome: 'ERROR',
            startedAt: '2026-11-22T03:00:00Z',
            durationMs: 3400,
          },
        },
      ],
      audit: [
        { id: 'a1', action: 'BOARD_LOGIN', createdAt: '2026-11-22T10:00:00Z' },
      ],
    },
    meta: { source: 'api' },
  } as never);
  vi.spyOn(admin, 'fetchAdminStatus').mockResolvedValue({
    data: {
      status: 'operational',
      uptimeSec: 3600,
      ts: new Date().toISOString(),
      checks: { api: { state: 'up', critical: true, latencyMs: 12 } },
    },
    meta: { source: 'api' },
  } as never);
  vi.spyOn(client, 'fetchPlatformStatus').mockResolvedValue({
    data: null,
    meta: { source: 'api' },
  } as never);
}

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

  it('opens on Health with system health and in-page status links', async () => {
    mockDashboard();
    await renderWithRouter(<AdminDashboardView />, {
      paths: ['/admin', '/admin/logs', '/admin/community', '/admin/financial'],
    });
    expect(screen.getByRole('tab', { name: 'Health' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByText('Chat and mail')).toBeNull();
    const headings = (await screen.findAllByRole('heading', { level: 2 })).map(
      (heading) => heading.textContent,
    );
    expect(headings).toContain('System health');
    expect(headings).toContain('Status checks');
    expect(headings).toContain('Live now (1)');
    expect(headings).not.toContain('Cron jobs');
    expect(headings).not.toContain('Grafana dashboards');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Health',
      'Jobs2',
      'Monitoring',
      'Activity',
    ]);
    expect(screen.getByRole('link', { name: 'Status checks' })).toHaveAttribute(
      'href',
      '/admin#status-checks',
    );
    expect(screen.getByRole('link', { name: 'View logs' })).toHaveAttribute(
      'href',
      '/admin/logs',
    );
    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute(
      'href',
      '/admin/community',
    );
  });

  it('navigates to the Activity tab', async () => {
    mockDashboard();
    const { router } = await renderWithRouter(<AdminDashboardView />, {
      paths: ['/admin'],
    });
    await screen.findByRole('heading', { name: 'System health' });
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    });
    expect(router.state.location.pathname).toBe('/admin');
    expect(router.state.location.search).toEqual({ tab: 'activity' });
  });

  it('shows Needs action on the Activity tab', async () => {
    mockDashboard();
    await renderWithRouter(<AdminDashboardView tab="activity" />, {
      paths: ['/admin'],
    });
    expect(
      await screen.findByRole('heading', { name: 'Needs action' }),
    ).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByRole('heading', { name: 'Recent audit events' }),
    ).toBeTruthy();
    expect(screen.queryByText('System health')).toBeNull();
  });

  it('puts queue health and cron jobs on the Jobs tab and opens run history from a row', async () => {
    mockDashboard();
    const history = vi.spyOn(admin, 'fetchAdminCronHistory').mockResolvedValue({
      ok: true,
      runs: [],
      total: 0,
    });
    await renderWithRouter(<AdminDashboardView tab="jobs" />, {
      paths: ['/admin', '/admin/streams'],
    });
    const queues = await screen.findByRole('list', { name: 'Queue health' });
    expect(queues.textContent).toContain('transcode');
    expect(queues.textContent).toContain('3 failed');
    const rows = screen.getAllByTestId('cron-job-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain('Failed');
    expect(rows[0]?.textContent).toContain('3.4 s');
    expect(rows[0]?.textContent).toContain('0 3 * * *');
    await act(async () => {
      fireEvent.click(rows[0]!);
    });
    expect(history).toHaveBeenCalledWith('nightly-backup');
    expect(screen.queryByText('System health')).toBeNull();
  });

  it('opens the Monitoring tab from an old #monitoring link', async () => {
    mockDashboard();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    await renderWithRouter(<AdminDashboardView />, {
      at: '/#monitoring',
      paths: ['/admin', '/admin/logs'],
    });
    expect(
      await screen.findByRole('heading', { name: 'Grafana dashboards' }),
    ).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Monitoring' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('link', { name: /Open Grafana/ })).toHaveAttribute(
      'href',
      expect.stringContaining('https://grafana.tahti.live/d/'),
    );
  });
});
