// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminFinancialView } from './AdminFinancialView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('AdminFinancialView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers Retry when the financial overview fails to load', async () => {
    const fetch = vi.spyOn(admin, 'fetchAdminFinancial').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    } as never);
    await renderWithRouter(<AdminFinancialView />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(
      await screen.findByText('Could not load financial data'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
