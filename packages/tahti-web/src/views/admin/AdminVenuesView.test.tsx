// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { renderWithRouter } from '../../test/renderWithRouter';
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
      {
        id: 'venue-2',
        slug: 'kuudes-linja',
        name: 'Kuudes Linja',
        city: 'Helsinki',
        countryCode: 'FI',
        verifiedAt: null,
        createdAt: '2026-05-21T12:00:00.000Z',
        createdBy: 'cmdef456submitterid',
        submitter: { username: 'nightdrive', displayName: 'Nightdrive' },
      },
    ],
    meta: { source: 'api' },
  })),
  setAdminVenueVerification: vi.fn(),
}));

describe('admin venues list', () => {
  afterEach(cleanup);

  it('shows the Admin → Venues breadcrumb', async () => {
    await renderWithRouter(<AdminVenuesView />, {
      paths: ['/u/$username'],
    });
    const nav = await screen.findByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.textContent).toContain('Admin');
    expect(nav.textContent).toContain('Venues');
    expect(
      screen.getByText(/notifies the person who registered it/),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('shows when a venue was submitted, not the submitter account id', async () => {
    await renderWithRouter(<AdminVenuesView />, {
      paths: ['/u/$username'],
    });
    const name = await screen.findByText('Northern Lights Hall');
    const row = name.closest('li') ?? name.parentElement?.parentElement;
    expect(row?.textContent).toContain(
      `submitted ${new Date('2026-05-20T12:00:00.000Z').toLocaleDateString()}`,
    );
    expect(document.body.textContent).not.toContain('cmabc123submitterid');
    expect(row?.textContent).not.toContain('submitted by');
  });

  it("links the submitter's profile when the API names them", async () => {
    await renderWithRouter(<AdminVenuesView />, {
      paths: ['/u/$username'],
    });
    const link = await screen.findByRole('link', { name: 'Nightdrive' });
    expect(link).toHaveAttribute('href', '/u/nightdrive');
    expect(link.parentElement?.textContent).toContain(
      'submitted by Nightdrive on',
    );
    expect(document.body.textContent).not.toContain('cmdef456submitterid');
  });

  it('says the venues failed to load instead of "No venues found"', async () => {
    vi.mocked(admin.fetchAdminVenues).mockResolvedValueOnce({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<AdminVenuesView />, {
      paths: ['/u/$username'],
    });
    expect(await screen.findByText('Could not load venues')).toBeTruthy();
    expect(screen.queryByText('No venues found')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Northern Lights Hall')).toBeTruthy();
  });

  it('clears a search that matches no venues', async () => {
    await renderWithRouter(<AdminVenuesView />, {
      paths: ['/u/$username'],
    });
    await screen.findByText('Northern Lights Hall');
    fireEvent.change(screen.getByLabelText('Search venues'), {
      target: { value: 'polka' },
    });
    expect(screen.getByText('No venues found')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Northern Lights Hall')).toBeTruthy();
  });
});
