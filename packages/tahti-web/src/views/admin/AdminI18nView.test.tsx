// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { fetchAdminLanguages } from '../../api/admin';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminI18nView } from './AdminI18nView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('admin languages without a translation API', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('reports a missing route as unavailable instead of sample languages', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );
    await expect(fetchAdminLanguages()).resolves.toMatchObject({
      data: [],
      unavailable: true,
    });
  });

  it('says so and offers no Add or Import action', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );
    await renderWithRouter(<AdminI18nView />);
    expect(await screen.findByText(/Not available yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New language' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Import CSV/ })).toBeNull();
  });

  it('lists the languages the API returns', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          languages: [
            {
              code: 'sv',
              name: 'Swedish',
              translatedKeys: 5,
              totalKeys: 10,
              isDefault: false,
              updatedAt: '2026-10-01T00:00:00.000Z',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    await renderWithRouter(<AdminI18nView />);
    expect(await screen.findByText('Swedish')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New language' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Import CSV/ })).toBeTruthy();
  });

  it('says the languages failed to load when the API errors', async () => {
    vi.spyOn(admin, 'fetchAdminLanguages').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<AdminI18nView />);
    expect(await screen.findByText('Could not load languages')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
