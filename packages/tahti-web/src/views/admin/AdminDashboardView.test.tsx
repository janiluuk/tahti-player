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
      liveStreams: [],
      queues: [],
      cronJobs: [],
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
    expect(
      screen.getByRole('heading', { name: 'Recent audit events' }),
    ).toBeTruthy();
    expect(screen.queryByText('System health')).toBeNull();
  });
});
