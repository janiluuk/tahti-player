// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminVenuesView } from './AdminVenuesView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('../../api/admin', () => ({
  fetchAdminVenues: vi.fn(async () => ({
    data: [
      {
        id: 'venue-1',
        slug: 'northern-lights-hall',
        name: 'Northern Lights Hall',
        city: 'Helsinki',
        countryCode: 'FI',
        verifiedAt: null,
        createdAt: '2026-05-20T12:00:00.000Z',
        createdBy: 'cmabc123submitterid',
      },
    ],
  })),
  setAdminVenueVerification: vi.fn(),
}));

describe('admin venues list', () => {
  afterEach(cleanup);

  it('shows when a venue was submitted, not the submitter account id', async () => {
    render(<AdminVenuesView />);
    const name = await screen.findByText('Northern Lights Hall');
    const row = name.closest('li') ?? name.parentElement?.parentElement;
    expect(row?.textContent).toContain(
      `submitted ${new Date('2026-05-20T12:00:00.000Z').toLocaleDateString()}`,
    );
    expect(document.body.textContent).not.toContain('cmabc123submitterid');
    expect(document.body.textContent).not.toContain('submitted by');
  });
});
