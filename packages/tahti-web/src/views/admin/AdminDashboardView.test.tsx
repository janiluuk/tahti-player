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
});
